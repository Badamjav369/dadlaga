// =====================================================
//  app.js — аппын эхлэл
//  Маршрутын хүснэгтийг энд нэг дор тодорхойлно
// =====================================================

import { defineRoutes, startRouter } from './core/router.js';
import { initTheme } from './core/theme.js';

import login         from './pages/login.js';
import register      from './pages/register.js';
import forgot        from './pages/forgot.js';
import reset         from './pages/reset.js';
import organizations from './pages/organizations.js';
import organization  from './pages/organization.js';
import profile       from './pages/profile.js';
import orgRequests   from './pages/orgRequests.js';
import orgProfile    from './pages/orgProfile.js';

defineRoutes([
  // Зочин
  { path: '/login',    page: login },
  { path: '/register', page: register },
  { path: '/forgot',   page: forgot },
  { path: '/reset',    page: reset },

  // Оюутан
  { path: '/organizations',     page: organizations },
  { path: '/organizations/:id', page: organization },
  { path: '/profile',           page: profile },

  // Байгууллага
  { path: '/org/requests', page: orgRequests },
  { path: '/org/profile',  page: orgProfile }
]);

initTheme();
startRouter();