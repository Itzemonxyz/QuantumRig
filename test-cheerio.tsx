globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
globalThis.window = { matchMedia: () => ({ matches: false }), innerWidth: 1024, addEventListener: () => {}, removeEventListener: () => {} };
globalThis.document = { body: { classList: { add: () => {}, remove: () => {} } } };
globalThis.navigator = { clipboard: { writeText: () => {} } };

import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import * as cheerio from 'cheerio';

import AnalyticsTab from './src/pages/admin/AnalyticsTab';
import AuditLogsTab from './src/pages/admin/AuditLogsTab';
import RolesTab from './src/pages/admin/RolesTab';
import ProductsTab from './src/pages/admin/ProductsTab';
import StockLogsTab from './src/pages/admin/StockLogsTab';
import CategoriesTab from './src/pages/admin/CategoriesTab';
import BrandsTab from './src/pages/admin/BrandsTab';
import OrdersTab from './src/pages/admin/OrdersTab';
import CouponsTab from './src/pages/admin/CouponsTab';
import OffersTab from './src/pages/admin/OffersTab';
import BannersTab from './src/pages/admin/BannersTab';
import FAQsTab from './src/pages/admin/FAQsTab';
import SupportTab from './src/pages/admin/SupportTab';
import RestockRequestsTab from './src/pages/admin/RestockRequestsTab';
import UsersTab from './src/pages/admin/UsersTab';
import SocialLinksTab from './src/pages/admin/SocialLinksTab';
import SettingsTab from './src/pages/admin/SettingsTab';

const tabs = {
  AnalyticsTab, AuditLogsTab, RolesTab, ProductsTab, StockLogsTab,
  CategoriesTab, BrandsTab, OrdersTab, CouponsTab, OffersTab, BannersTab,
  FAQsTab, SupportTab, RestockRequestsTab, UsersTab, SocialLinksTab, SettingsTab
};

for (const [name, Component] of Object.entries(tabs)) {
  try {
    const html = renderToString(
      <MemoryRouter>
        <Component />
      </MemoryRouter>
    );
    
    const $ = cheerio.load(html);
    
    const ths = $('table th');
    if (ths.length > 0) {
      console.log(`\nComponent ${name} has tables. First column headers:`);
      $('table').each((i, table) => {
        const firstTh = $(table).find('thead tr th:first-child').text();
        console.log(` - Table ${i}: "${firstTh}"`);
        
        let path = [];
        let el = table;
        while (el && el.tagName) {
          let index = 1;
          let sib = el.previousSibling;
          while (sib) {
            if (sib.tagName === el.tagName) index++;
            sib = sib.previousSibling;
          }
          path.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${index})`);
          el = el.parentNode;
        }
        console.log(`   Path: ${path.join(' > ')}`);
      });
    }
  } catch (err) {
    console.error(`Error rendering ${name}: ${err.message}`);
  }
}
