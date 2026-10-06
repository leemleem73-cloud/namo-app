'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');

if (!express.__QMES_VENDOR_STATIC_20261006__) {
  express.__QMES_VENDOR_STATIC_20261006__ = true;
  const originalStatic = express.static;
  const root = __dirname;
  const candidates = {
    '/vendor/react.production.min.js': [
      'node_modules/react/umd/react.production.min.js'
    ],
    '/vendor/react-dom.production.min.js': [
      'node_modules/react-dom/umd/react-dom.production.min.js'
    ],
    '/vendor/prop-types.min.js': [
      'node_modules/prop-types/prop-types.min.js'
    ],
    '/vendor/Recharts.js': [
      'node_modules/recharts/umd/Recharts.js',
      'node_modules/recharts/umd/Recharts.min.js'
    ],
    '/vendor/babel.min.js': [
      'node_modules/@babel/standalone/babel.min.js'
    ],
    '/vendor/JsBarcode.all.min.js': [
      'node_modules/jsbarcode/dist/JsBarcode.all.min.js',
      'node_modules/jsbarcode/bin/JsBarcode.js'
    ],
    '/vendor/qrcode.min.js': [
      'node_modules/qrcodejs/qrcode.min.js',
      'node_modules/qrcodejs/qrcode.js'
    ]
  };

  express.static = function qmesVendorStatic(publicRoot, options) {
    const staticMiddleware = originalStatic(publicRoot, options);
    return function qmesVendorStaticMiddleware(req, res, next) {
      const pathname = String(req.path || '');
      const list = candidates[pathname];
      if (!list) return staticMiddleware(req, res, next);

      const file = list.map(rel => path.join(root, rel)).find(candidate => fs.existsSync(candidate));
      if (!file) {
        res.status(404).type('text/plain').send('QMES vendor asset missing');
        return;
      }
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
      res.type('application/javascript');
      return res.sendFile(file);
    };
  };
}
