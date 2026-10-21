-- Durable LOT interlock. Triggers also cover legacy/sync writers and direct SQL.
-- One transaction-scoped lock orders inspection changes, releases and movements.
CREATE TABLE IF NOT EXISTS qmes_lot_holds (
 id BIGSERIAL PRIMARY KEY, lot TEXT NOT NULL, source TEXT NOT NULL,
 kind TEXT NOT NULL, reason TEXT NOT NULL, evidence JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 released_at TIMESTAMPTZ, released_by TEXT, release_reason TEXT, release_evidence JSONB
);
CREATE UNIQUE INDEX IF NOT EXISTS qmes_lot_hold_active ON qmes_lot_holds(lot,source) WHERE released_at IS NULL;
CREATE TABLE IF NOT EXISTS qmes_lot_gate_events (
 id BIGSERIAL PRIMARY KEY, occurred_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 action TEXT NOT NULL, lot TEXT NOT NULL DEFAULT '', actor TEXT NOT NULL DEFAULT '',
 detail JSONB NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS qmes_lot_observations (
 source TEXT NOT NULL, entry TEXT NOT NULL, kind TEXT NOT NULL, lot TEXT NOT NULL,
 inspection_date TEXT NOT NULL, payload JSONB NOT NULL, observed_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(source,entry)
);
CREATE INDEX IF NOT EXISTS qmes_lot_observations_lot ON qmes_lot_observations(lot,kind,inspection_date);
CREATE TABLE IF NOT EXISTS qmes_lot_gate_installed (table_name TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS qmes_lot_genealogy (
 parent_lot TEXT NOT NULL, child_lot TEXT NOT NULL, source TEXT NOT NULL,
 PRIMARY KEY(parent_lot,child_lot,source)
);

CREATE OR REPLACE FUNCTION qmes_gate_lot(j JSONB) RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
 SELECT upper(btrim(coalesce(nullif(j->>'lot',''),nullif(j->>'lotNo',''),nullif(j->>'lot_no',''),
 nullif(j->>'finishedLot',''),nullif(j->>'finished_lot',''),nullif(j->>'productionLot',''),
 nullif(j->>'productionLotNo',''),nullif(j->>'materialLot',''),j#>>'{fields,생산 LOT NO}',j#>>'{detailFields,생산 LOT NO}','')))
$$;
CREATE OR REPLACE FUNCTION qmes_gate_bad(j JSONB) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE k TEXT; v JSONB;
BEGIN
 IF jsonb_typeof(j)='array' THEN
  FOR v IN SELECT value FROM jsonb_array_elements(j) LOOP IF qmes_gate_bad(v) THEN RETURN true; END IF; END LOOP;
 ELSIF jsonb_typeof(j)='object' THEN
  FOR k,v IN SELECT * FROM jsonb_each(j) LOOP
   IF k IN ('judge','inspectionDecision','검사합부','검사판정','quality_status','qualityStatus','shippingStatus','판정')
    AND upper(btrim(v#>>'{}')) IN ('불합격','부적합','보류','출하보류','HOLD','NONCONFORM','FAIL','NG','REJECTED') THEN RETURN true; END IF;
   IF k IN ('fail','failQty','fail_qty') AND coalesce(v#>>'{}','') ~ '^[0-9]+([.][0-9]+)?$' AND (v#>>'{}')::numeric>0 THEN RETURN true; END IF;
   IF k IN ('items','items_json','detailFields') AND qmes_gate_bad(v) THEN RETURN true; END IF;
  END LOOP;
 END IF;
 RETURN false;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_value_ok(item TEXT, val TEXT) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE n NUMERIC; t TEXT:=btrim(coalesce(val,''));
BEGIN
 IF item='외관' THEN RETURN regexp_replace(t,'\s','','g')='이상없음'; END IF;
 IF item='전해액 안정성' THEN RETURN regexp_replace(t,'\s','','g')='미탈리'; END IF;
 IF item='절연저항' AND lower(t)='overflow' THEN RETURN true; END IF;
 IF t LIKE '%,%' THEN
  IF t !~ '^[+-]?[0-9]{1,3}(,[0-9]{3})+([.][0-9]+)?$' THEN RETURN false; END IF;
  t:=replace(t,',','');
 END IF;
 IF length(t)>100 OR t !~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$' THEN RETURN false; END IF;
 BEGIN n:=t::numeric; EXCEPTION WHEN OTHERS THEN RETURN false; END;
 RETURN CASE item WHEN '입도(Dmax)' THEN n>=0 AND n<10 WHEN '점도' THEN n BETWEEN 1200 AND 1800
 WHEN '수분율' THEN n>=0 AND n<2000 WHEN '고형분' THEN n BETWEEN 19 AND 21
 WHEN '접착력' THEN n>=400 WHEN '절연저항' THEN n>=200 ELSE false END;
END $$;
CREATE OR REPLACE FUNCTION qmes_gate_values(j JSONB) RETURNS JSONB LANGUAGE SQL IMMUTABLE AS $$
 SELECT CASE WHEN jsonb_typeof(j->'measurements')='array' AND jsonb_array_length(j->'measurements')>0 THEN j->'measurements'
 ELSE to_jsonb(regexp_split_to_array(coalesce(j->>'value',''),'\s*/\s*')) END
$$;
CREATE OR REPLACE FUNCTION qmes_gate_measure_judge(item TEXT, vals JSONB) RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE i INT; v TEXT; complete BOOLEAN:=true;
BEGIN
 IF item NOT IN ('외관','입도(Dmax)','점도','수분율','고형분','접착력','절연저항','전해액 안정성') THEN RETURN '대기'; END IF;
 FOR i IN 0..2 LOOP
  v:=btrim(coalesce(vals->>i,''));
  IF v='' THEN complete:=false; ELSIF NOT qmes_gate_value_ok(item,v) THEN RETURN '불합격'; END IF;
 END LOOP;
 RETURN CASE WHEN complete THEN '합격' ELSE '대기' END;
END $$;
CREATE OR REPLACE FUNCTION qmes_gate_measure_bad(j JSONB, kind TEXT) RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE item TEXT; vals JSONB;
BEGIN
 IF kind NOT IN ('pqc','oqc') THEN RETURN false; END IF;
 IF jsonb_typeof(j->'measurements')='object' THEN
  FOR item,vals IN SELECT * FROM jsonb_each(j->'measurements') LOOP
   IF item='수분' THEN item:='수분율'; END IF;
   IF item='입도' THEN item:='입도(Dmax)'; END IF;
   IF qmes_gate_measure_judge(item,vals)='불합격' THEN RETURN true; END IF;
  END LOOP;
 ELSIF j ? 'check' THEN
  item:=CASE j->>'check' WHEN '수분' THEN '수분율' WHEN '입도' THEN '입도(Dmax)' ELSE j->>'check' END;
  RETURN qmes_gate_measure_judge(item,qmes_gate_values(j))='불합격';
 END IF;
 RETURN false;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_hold(l TEXT, s TEXT, k TEXT, r TEXT, e JSONB) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE hid BIGINT;
BEGIN
 l:=upper(btrim(coalesce(l,''))); IF l='' THEN RETURN; END IF;
 INSERT INTO qmes_lot_holds(lot,source,kind,reason,evidence) VALUES(l,s,k,r,e)
 ON CONFLICT(lot,source) WHERE released_at IS NULL DO NOTHING RETURNING id INTO hid;
 IF hid IS NOT NULL THEN INSERT INTO qmes_lot_gate_events(action,lot,detail) VALUES('HOLD',l,jsonb_build_object('holdId',hid,'source',s,'reason',r)); END IF;
END $$;

-- Flatten only known record containers; arbitrary notes never become a LOT or judgement.
CREATE OR REPLACE FUNCTION qmes_gate_observe(j JSONB, s TEXT, k TEXT, p_entry TEXT DEFAULT '0') RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v JSONB; n INT:=0; l TEXT;
BEGIN
 IF jsonb_typeof(j)='array' THEN
  FOR v IN SELECT value FROM jsonb_array_elements(j) LOOP
   PERFORM qmes_gate_observe(v,s,k,p_entry||'/'||n); n:=n+1;
  END LOOP; RETURN;
 END IF;
 IF jsonb_typeof(j)<>'object' THEN RETURN; END IF;
 IF j ? 'rows' THEN PERFORM qmes_gate_observe(j->'rows',s,k,p_entry||'/rows'); RETURN; END IF;
 IF k='inventory' AND j ? 'holds' THEN PERFORM qmes_gate_observe(j->'holds',s,'ncr',p_entry||'/holds'); END IF;
 IF k='ncr' AND j ? 'target' AND qmes_gate_lot(j)='' THEN j:=j||jsonb_build_object('lot',j->>'target'); END IF;
 l:=qmes_gate_lot(j); IF l='' THEN RETURN; END IF;
 INSERT INTO qmes_lot_observations(source,entry,kind,lot,inspection_date,payload)
 VALUES(s,p_entry,k,l,left(coalesce(j->>'date',j->>'inspectedAt',j->>'recv',j->>'occurred_on',''),10),j)
 ON CONFLICT(source,entry) DO UPDATE SET kind=k,lot=l,inspection_date=EXCLUDED.inspection_date,payload=j,observed_at=clock_timestamp();
 IF qmes_gate_bad(j) OR qmes_gate_measure_bad(j,k)
 OR (k='ncr' AND upper(coalesce(j->>'status','OPEN')) NOT IN ('CLOSED','종결','완료','해제')) THEN
  PERFORM qmes_gate_hold(l,s||'/'||p_entry,k,upper(k)||' 부적합 / 보류',j);
 END IF;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_inspection_pass(l TEXT, k TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE latest TEXT; item TEXT; vals JSONB; j JSONB; found_item BOOLEAN; required TEXT[];
BEGIN
 SELECT max(inspection_date) INTO latest FROM qmes_lot_observations WHERE lot=l AND kind=k;
 IF latest IS NULL THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM qmes_lot_observations WHERE lot=l AND kind=k AND inspection_date=latest
  AND (qmes_gate_bad(payload) OR qmes_gate_measure_bad(payload,k))) THEN RETURN false; END IF;
 IF k='iqc' THEN
  RETURN EXISTS(SELECT 1 FROM qmes_lot_observations WHERE lot=l AND kind=k AND inspection_date=latest
   AND (payload->>'judge' IN ('합격','PASS','OK') OR
    (jsonb_typeof(coalesce(payload->'items_json',payload->'items'))='array'
     AND jsonb_array_length(coalesce(payload->'items_json',payload->'items'))>0
     AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(payload->'items_json',payload->'items')) x
      WHERE coalesce(x->>'judge','') NOT IN ('합격','PASS','OK')))));
 END IF;
 required:=CASE WHEN k='pqc' THEN ARRAY['외관','입도(Dmax)','점도','고형분']
 ELSE ARRAY['외관','입도(Dmax)','점도','수분율','고형분','접착력','절연저항','전해액 안정성'] END;
 FOREACH item IN ARRAY required LOOP
  found_item:=false;
  FOR j IN SELECT payload FROM qmes_lot_observations WHERE lot=l AND kind=k AND inspection_date=latest LOOP
   vals:=NULL;
   IF jsonb_typeof(j->'measurements')='object' THEN
    vals:=coalesce(j->'measurements'->item,CASE item WHEN '수분율' THEN j#>'{measurements,수분}' WHEN '입도(Dmax)' THEN j#>'{measurements,입도}' END);
   ELSIF (CASE j->>'check' WHEN '수분' THEN '수분율' WHEN '입도' THEN '입도(Dmax)' ELSE j->>'check' END)=item THEN vals:=qmes_gate_values(j);
   END IF;
   IF vals IS NOT NULL THEN
    IF qmes_gate_measure_judge(item,vals)<>'합격' THEN RETURN false; END IF;
    found_item:=true;
   END IF;
  END LOOP;
  IF NOT found_item THEN RETURN false; END IF;
 END LOOP;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_assert(l TEXT, action TEXT, shipping BOOLEAN DEFAULT false, visited TEXT[] DEFAULT '{}') RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE h RECORD; d RECORD; m JSONB; raw_lot TEXT;
BEGIN
 l:=upper(btrim(coalesce(l,'')));
 IF l='' THEN RAISE EXCEPTION '[QUALITY_GATE] % 차단: LOT 번호가 필요합니다.',action; END IF;
 IF l=ANY(visited) THEN RETURN; END IF;
 visited:=array_append(visited,l);
 SELECT * INTO h FROM qmes_lot_holds WHERE lot=l AND released_at IS NULL ORDER BY id LIMIT 1;
 IF FOUND THEN RAISE EXCEPTION '[QUALITY_GATE] LOT % · % 차단: % (보류번호 %). 품질 보류/해제에서 확인하세요.',l,action,h.reason,h.id; END IF;
 FOR d IN SELECT parent_lot FROM qmes_lot_genealogy WHERE child_lot=l LOOP
  PERFORM qmes_gate_assert(d.parent_lot,action,false,visited);
 END LOOP;
 -- A raw/intermediate LOT held after production must also stop its descendants.
 IF to_regclass('public.qmes_work_order_documents') IS NOT NULL THEN
  FOR d IN EXECUTE 'SELECT document FROM qmes_work_order_documents WHERE qmes_gate_lot(document)=$1' USING l LOOP
   FOR m IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(d.document->'materials')='array' THEN d.document->'materials' ELSE '[]'::jsonb END) LOOP
    raw_lot:=qmes_gate_lot(m); IF raw_lot<>'' THEN PERFORM qmes_gate_assert(raw_lot,action,false,visited); END IF;
   END LOOP;
  END LOOP;
 END IF;
 IF to_regclass('public.worklog_materials') IS NOT NULL AND to_regclass('public.worklog') IS NOT NULL THEN
  FOR d IN EXECUTE 'SELECT DISTINCT m.lot_no FROM worklog_materials m JOIN worklog w ON w.id=m.worklog_id WHERE upper(btrim(w.finished_lot))=$1' USING l LOOP
   IF btrim(coalesce(d.lot_no,''))<>'' THEN PERFORM qmes_gate_assert(d.lot_no,action,false,visited); END IF;
  END LOOP;
 END IF;
 IF shipping AND NOT qmes_gate_inspection_pass(l,'oqc') THEN
  RAISE EXCEPTION '[QUALITY_GATE] LOT % · % 차단: 최신 출하검사 8개 항목의 3회 측정 합격이 필요합니다.',l,action;
 END IF;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_document_body(j JSONB) RETURNS JSONB LANGUAGE SQL IMMUTABLE AS $$
 SELECT CASE WHEN jsonb_typeof(j->'doc')='object' THEN (j->'doc')||jsonb_build_object('lot',qmes_gate_lot(j),'materials',coalesce(j#>'{doc,inputs}','[]')) ELSE j END
$$;
CREATE OR REPLACE FUNCTION qmes_gate_link_document(j JSONB, s TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE m JSONB; l TEXT;
BEGIN
 j:=qmes_gate_document_body(j); l:=qmes_gate_lot(j); IF l='' THEN RETURN; END IF;
 FOR m IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j->'materials')='array' THEN j->'materials' ELSE '[]'::jsonb END) LOOP
  IF qmes_gate_lot(m)<>'' AND qmes_gate_lot(m)<>l THEN
   INSERT INTO qmes_lot_genealogy(parent_lot,child_lot,source) VALUES(qmes_gate_lot(m),l,s) ON CONFLICT DO NOTHING;
  END IF;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION qmes_gate_document(j JSONB, oldj JSONB DEFAULT '{}') RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE m JSONB; l TEXT; status TEXT;
BEGIN
 IF j=oldj THEN RETURN; END IF;
 j:=qmes_gate_document_body(j); oldj:=qmes_gate_document_body(oldj);
 l:=qmes_gate_lot(j); status:=coalesce(j#>>'{fields,진행상태}',j->>'manualStatus',j->>'status','');
 IF status IN ('완료','공정완료','생산완료','COMPLETED')
 AND (status IS DISTINCT FROM coalesce(oldj#>>'{fields,진행상태}',oldj->>'manualStatus',oldj->>'status','') OR j->'materials' IS DISTINCT FROM oldj->'materials' OR j->'productionActual' IS DISTINCT FROM oldj->'productionActual' OR l<>qmes_gate_lot(oldj)) THEN
  PERFORM qmes_gate_assert(l,'공정 완료');
 END IF;
 IF j->'materials' IS DISTINCT FROM oldj->'materials' OR l<>qmes_gate_lot(oldj) THEN
  FOR m IN SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(j->'materials')='array' THEN j->'materials' ELSE '[]'::jsonb END) LOOP
   IF qmes_gate_lot(m)<>'' THEN PERFORM qmes_gate_assert(qmes_gate_lot(m),'원료 투입 / 배정');
   ELSIF coalesce(m->>'actual',m->>'act','') NOT IN ('','0') THEN RAISE EXCEPTION '[QUALITY_GATE] 원료 투입 차단: 원료 LOT 번호가 필요합니다.'; END IF;
  END LOOP;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION qmes_gate_shipping(j JSONB, oldj JSONB DEFAULT '{}') RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE v JSONB; previous JSONB; identity TEXT;
BEGIN
 IF j=oldj THEN RETURN; END IF;
 IF jsonb_typeof(j)='array' THEN
  FOR v IN SELECT value FROM jsonb_array_elements(j) LOOP
   -- unchanged historical shipments may remain in a full-list sync.
   IF jsonb_typeof(oldj)='array' AND oldj @> jsonb_build_array(v) THEN CONTINUE; END IF;
   PERFORM qmes_gate_shipping(v);
  END LOOP; RETURN;
 END IF;
 IF jsonb_typeof(j)<>'object' THEN RETURN; END IF;
 IF j ? 'rows' THEN PERFORM qmes_gate_shipping(j->'rows',oldj->'rows'); RETURN; END IF;
 IF coalesce(j->>'shippingStatus','') IN ('출하완료','출하확정','납품완료','SHIPPED','완료')
 OR coalesce(j->>'status','') IN ('출하완료','출하확정','납품완료','SHIPPED','완료')
 OR coalesce(j->>'delivery','') IN ('납품완료','출하완료')
 OR j->>'actualShipment'='true' THEN PERFORM qmes_gate_assert(qmes_gate_lot(j),'출하 확정',true); END IF;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_source(j JSONB, tab TEXT, remove BOOLEAN DEFAULT false) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE s TEXT; k TEXT; p JSONB;
BEGIN
 IF tab='qmes_sync_records' THEN
  k:=j->>'record_type'; s:='sync:'||k||':'||(j->>'record_key'); p:=j->'payload';
  IF k='workorder' AND NOT remove THEN PERFORM qmes_gate_link_document(p,s); END IF;
 ELSIF tab='qmes_work_order_documents' THEN
  IF NOT remove THEN PERFORM qmes_gate_link_document(j->'document',tab||':'||(j->>'id')); END IF; RETURN;
 ELSIF tab='worklog_materials' THEN
  IF NOT remove THEN
   EXECUTE 'INSERT INTO qmes_lot_genealogy(parent_lot,child_lot,source) SELECT $1,upper(btrim(finished_lot)),$2 FROM worklog WHERE id::text=$3 AND btrim(finished_lot)<>'''' AND $1<>'''' ON CONFLICT DO NOTHING'
    USING qmes_gate_lot(j),tab||':'||(j->>'worklog_id'),j->>'worklog_id';
  END IF; RETURN;
 ELSIF tab='inventory_balances' THEN
  k:='inventory'; s:=tab||':'||concat_ws(':',j->>'item_code',j->>'lot_no',j->>'location_code',j->>'quality_status'); p:=j;
 ELSE
  k:=CASE WHEN tab IN ('qmes_ncr_reports','nonconform') THEN 'ncr' ELSE tab END;
  s:=tab||':'||(j->>'id'); p:=j;
 END IF;
 IF k NOT IN ('iqc','pqc','oqc','ncr','nonconform','inventory') THEN RETURN; END IF;
 IF k='nonconform' THEN k:='ncr'; END IF;
 DELETE FROM qmes_lot_observations WHERE source=s;
 IF NOT remove THEN PERFORM qmes_gate_observe(p,s,k); END IF;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_lock_trigger() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(20261021,731);
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION qmes_gate_trigger() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE j JSONB; o JSONB:='{}'; k TEXT; v JSONB; typ TEXT;
BEGIN
 IF TG_OP<>'INSERT' THEN o:=to_jsonb(OLD); END IF;
 IF TG_OP='DELETE' THEN PERFORM qmes_gate_source(o,TG_TABLE_NAME,true); RETURN OLD; END IF;
 j:=to_jsonb(NEW);
 PERFORM qmes_gate_source(j,TG_TABLE_NAME);
 CASE TG_TABLE_NAME
 WHEN 'qmes_work_order_documents' THEN PERFORM qmes_gate_document(j->'document',coalesce(o->'document','{}'));
 WHEN 'worklog' THEN
  IF (j->>'prod_qty') IS DISTINCT FROM (o->>'prod_qty') OR (j->>'finished_lot') IS DISTINCT FROM (o->>'finished_lot') THEN
   IF coalesce(j->>'prod_qty','') ~ '^[0-9]+([.][0-9]+)?$' AND (j->>'prod_qty')::numeric>0 THEN PERFORM qmes_gate_assert(qmes_gate_lot(j),'생산 실적'); END IF;
  END IF;
 WHEN 'worklog_materials' THEN
  IF qmes_gate_lot(j)<>'' THEN PERFORM qmes_gate_assert(qmes_gate_lot(j),'원료 투입');
  ELSIF coalesce(j->>'input_qty','') NOT IN ('','0') THEN RAISE EXCEPTION '[QUALITY_GATE] 원료 투입 차단: 원료 LOT 번호가 필요합니다.'; END IF;
 WHEN 'inventory_reservations' THEN IF j->>'status' IS DISTINCT FROM 'RELEASED' THEN PERFORM qmes_gate_assert(qmes_gate_lot(j),'원료 배정'); END IF;
 WHEN 'inventory_transactions' THEN
  typ:=j->>'transaction_type';
  IF typ IN ('ISSUE','PRODUCTION_ISSUE','PRODUCTION_RECEIPT','SHIPMENT','RELEASE') THEN
   PERFORM qmes_gate_assert(qmes_gate_lot(j),CASE typ WHEN 'SHIPMENT' THEN '출하 확정' WHEN 'RELEASE' THEN '재고 해제' ELSE '생산 / 투입' END,typ='SHIPMENT');
  END IF;
 WHEN 'qmes_sync_records' THEN
  k:=j->>'record_type';
  IF k='workorder' THEN
   IF jsonb_typeof(j#>'{payload,rows}')='array' THEN
    FOR v IN SELECT value FROM jsonb_array_elements(j#>'{payload,rows}') LOOP
     IF coalesce(o#>'{payload,rows}','[]') @> jsonb_build_array(v) THEN CONTINUE; END IF;
     PERFORM qmes_gate_document(v);
    END LOOP;
   ELSE PERFORM qmes_gate_document(j->'payload',coalesce(o->'payload','{}')); END IF;
   IF jsonb_typeof(j#>'{payload,lotRecord,ship}')='object' AND j#>'{payload,lotRecord,ship}' IS DISTINCT FROM o#>'{payload,lotRecord,ship}' THEN
    PERFORM qmes_gate_assert(qmes_gate_lot(j->'payload'),'출하 확정',true);
   END IF;
  ELSIF k IN ('oqc','inventory') THEN PERFORM qmes_gate_shipping(j->'payload',coalesce(o->'payload','{}'));
  ELSIF k='coa' THEN RAISE EXCEPTION '[QUALITY_GATE] CoA는 출하검사 성적서의 정식 발행 기능을 사용하세요.';
  END IF;
 WHEN 'oqc' THEN PERFORM qmes_gate_shipping(j,o);
 WHEN 'qmes_oqc_coa_issues' THEN IF TG_OP='INSERT' THEN PERFORM qmes_gate_assert(j#>>'{snapshot,fields,lot}','CoA 발행',true); END IF;
 WHEN 'certificates' THEN IF upper(coalesce(j->>'cert_type','')) ~ 'OQC|출하' THEN PERFORM qmes_gate_assert(qmes_gate_lot(j),'성적서 발행',true); END IF;
 ELSE NULL;
 END CASE;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION qmes_gate_install() RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE tab TEXT; r RECORD;
BEGIN
 PERFORM pg_advisory_xact_lock(20261021,731);
 FOREACH tab IN ARRAY ARRAY['iqc','pqc','oqc','qmes_sync_records','qmes_work_order_documents','worklog','worklog_materials',
  'inventory_balances','inventory_transactions','inventory_reservations','qmes_ncr_reports','nonconform','qmes_oqc_coa_issues','certificates'] LOOP
  IF to_regclass('public.'||tab) IS NULL OR EXISTS(SELECT 1 FROM qmes_lot_gate_installed WHERE table_name=tab) THEN CONTINUE; END IF;
  EXECUTE format('CREATE TRIGGER qmes_gate_lock BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION qmes_gate_lock_trigger()',tab);
  EXECUTE format('CREATE TRIGGER qmes_gate_enforce AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION qmes_gate_trigger()',tab);
  IF tab IN ('iqc','pqc','oqc','qmes_sync_records','inventory_balances','qmes_ncr_reports','nonconform','qmes_work_order_documents','worklog_materials') THEN
   FOR r IN EXECUTE format('SELECT to_jsonb(t) AS j FROM %I t',tab) LOOP PERFORM qmes_gate_source(r.j,tab); END LOOP;
  END IF;
  INSERT INTO qmes_lot_gate_installed(table_name) VALUES(tab);
 END LOOP;
END $$;
SELECT qmes_gate_install();
