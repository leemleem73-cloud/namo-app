CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  login_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  title VARCHAR(50),
  role VARCHAR(30) NOT NULL DEFAULT 'user',
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('user', 'manager', 'executive', 'admin')),
  CONSTRAINT users_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  manager VARCHAR(100),
  phone VARCHAR(50),
  category VARCHAR(50),
  status VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS iqc (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  receipt_date DATE,
  lot VARCHAR(100) NOT NULL,
  supplier VARCHAR(150),
  item VARCHAR(150),
  coa_no VARCHAR(100),
  in_qty INTEGER NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  fail INTEGER NOT NULL DEFAULT 0,
  appearance_result VARCHAR(100),
  appearance_judge VARCHAR(20),
  package_result VARCHAR(100),
  package_judge VARCHAR(20),
  label_result VARCHAR(100),
  label_judge VARCHAR(20),
  coa_result VARCHAR(100),
  coa_judge VARCHAR(20),
  inspector VARCHAR(100),
  remark TEXT,
  judge VARCHAR(20) NOT NULL,
  writer VARCHAR(100),
  writer_date TIMESTAMP,
  writer_sign TEXT,
  reviewer VARCHAR(100),
  reviewer_date TIMESTAMP,
  reviewer_sign TEXT,
  approver VARCHAR(100),
  approver_date TIMESTAMP,
  approver_sign TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  pdf_path TEXT,
  CONSTRAINT iqc_qty_check CHECK (in_qty >= 0 AND qty >= 0),
  CONSTRAINT iqc_fail_check CHECK (fail >= 0 AND fail <= qty),
  CONSTRAINT iqc_judge_check CHECK (judge IN ('합격', '불합격')),
  CONSTRAINT iqc_status_check CHECK (status IN ('Draft', 'Reviewed', 'Approved'))
);

CREATE TABLE IF NOT EXISTS ipqc (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  product VARCHAR(150),
  lot VARCHAR(100) NOT NULL,
  visual VARCHAR(100),
  viscosity VARCHAR(100),
  solid VARCHAR(100),
  particle VARCHAR(100),
  qty INTEGER NOT NULL DEFAULT 0,
  fail INTEGER NOT NULL DEFAULT 0,
  inspector VARCHAR(100),
  remark TEXT,
  judge VARCHAR(20) NOT NULL,
  writer VARCHAR(100),
  writer_date TIMESTAMP,
  writer_sign TEXT,
  reviewer VARCHAR(100),
  reviewer_date TIMESTAMP,
  reviewer_sign TEXT,
  approver VARCHAR(100),
  approver_date TIMESTAMP,
  approver_sign TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  pdf_path TEXT,
  CONSTRAINT ipqc_qty_check CHECK (qty >= 0),
  CONSTRAINT ipqc_fail_check CHECK (fail >= 0 AND fail <= qty),
  CONSTRAINT ipqc_judge_check CHECK (judge IN ('합격', '불합격')),
  CONSTRAINT ipqc_status_check CHECK (status IN ('Draft', 'Reviewed', 'Approved'))
);

CREATE TABLE IF NOT EXISTS oqc (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  customer VARCHAR(150),
  product VARCHAR(150),
  lot VARCHAR(100) NOT NULL,
  visual VARCHAR(150),
  coa VARCHAR(100),
  viscosity VARCHAR(100),
  solid VARCHAR(100),
  particle VARCHAR(100),
  adhesion VARCHAR(100),
  resistance VARCHAR(100),
  swelling VARCHAR(100),
  moisture VARCHAR(100),
  qty INTEGER NOT NULL DEFAULT 0,
  fail INTEGER NOT NULL DEFAULT 0,
  inspector VARCHAR(100),
  remark TEXT,
  judge VARCHAR(20) NOT NULL,
  writer VARCHAR(100),
  writer_date TIMESTAMP,
  writer_sign TEXT,
  reviewer VARCHAR(100),
  reviewer_date TIMESTAMP,
  reviewer_sign TEXT,
  approver VARCHAR(100),
  approver_date TIMESTAMP,
  approver_sign TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  pdf_path TEXT,
  CONSTRAINT oqc_qty_check CHECK (qty >= 0),
  CONSTRAINT oqc_fail_check CHECK (fail >= 0 AND fail <= qty),
  CONSTRAINT oqc_judge_check CHECK (judge IN ('합격', '불합격')),
  CONSTRAINT oqc_status_check CHECK (status IN ('Draft', 'Reviewed', 'Approved'))
);

CREATE TABLE IF NOT EXISTS ncrs (
  id VARCHAR(50) PRIMARY KEY,
  ncr_no VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(20) NOT NULL,
  source_no VARCHAR(100),
  item_name VARCHAR(150),
  lot_no VARCHAR(100),
  defect_type VARCHAR(100),
  severity VARCHAR(20),
  disposition VARCHAR(100),
  owner_name VARCHAR(100),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  print_no VARCHAR(100),
  writer VARCHAR(100),
  writer_date TIMESTAMP,
  writer_sign TEXT,
  reviewer VARCHAR(100),
  reviewer_date TIMESTAMP,
  reviewer_sign TEXT,
  approver VARCHAR(100),
  approver_date TIMESTAMP,
  approver_sign TEXT,
  pdf_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT ncr_status_check CHECK (status IN ('Draft', 'Reviewed', 'Approved'))
);

CREATE TABLE IF NOT EXISTS nonconform (
  id VARCHAR(50) PRIMARY KEY,
  date DATE NOT NULL,
  type VARCHAR(50),
  lot VARCHAR(100),
  item VARCHAR(150),
  issue VARCHAR(200),
  cause VARCHAR(200),
  action VARCHAR(200),
  owner VARCHAR(100),
  status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email VARCHAR(150),
  action_type VARCHAR(50),
  target_table VARCHAR(50),
  target_id VARCHAR(100),
  detail TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_iqc_date ON iqc(date);
CREATE INDEX IF NOT EXISTS idx_ipqc_date ON ipqc(date);
CREATE INDEX IF NOT EXISTS idx_oqc_date ON oqc(date);
CREATE INDEX IF NOT EXISTS idx_ncrs_created_at ON ncrs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
