'use strict';

const path = require('path');
const express = require('express');

if (!express.__NAMO_PRODUCTION_FINAL_PRELOAD_20261026__) {
  express.__NAMO_PRODUCTION_FINAL_PRELOAD_20261026__ = true;
  const originalStatic = express.static;

  express.static = function namoProductionFinalStatic(root, options) {
    const middleware = originalStatic(root, options);
    return function namoProductionFinalStaticMiddleware(req, res, next) {
      const pathname = String(req.path || '').toLowerCase();
      if (
        pathname === '/js/qmes-production-status-list-clean-20261026.js' ||
        pathname === '/js/qmes-production-status-20261026.js' ||
        pathname === '/js/qmes-production-results-20261023.js'
      ) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.sendFile(path.resolve(root, 'js', 'qmes-production-status-final-workorderstyle-v2-20261026.js'), function(err){
          if(err)return next(err);
        });
      }
      return middleware(req, res, next);
    };
  };
}