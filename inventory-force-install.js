'use strict';

// Ensures inventory API routes are installed even when the late GET hook in
// inventory-server.js is skipped by a hosting/runtime startup variation.
// This file is preloaded after inventory-server.js and before server.js.
const express = require('express');
const { installInventoryRoutes } = require('./inventory-server');

const originalPost = express.application.post;
express.application.post = function inventoryAwarePost(routePath, ...handlers) {
  // server.js registers session middleware before its API POST routes.
  // Install the inventory routes immediately before the first API POST route,
  // so requireLogin can see req.session and POST /api/inventory/transactions
  // cannot fall through to a 404.
  if (typeof routePath === 'string' && routePath.startsWith('/api/') && !this.__qmesInventoryInstalled) {
    installInventoryRoutes(this);
  }
  return originalPost.call(this, routePath, ...handlers);
};
