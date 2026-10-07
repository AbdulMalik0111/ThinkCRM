import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'src', 'pages');

const pagesToCreate = [
  // Orders
  'orders/detail.jsx',
  'orders/returns.jsx',
  'orders/refunds.jsx',

  // Prescriptions
  'prescriptions/detail.jsx',

  // Catalog
  'catalog/products/index.jsx',
  'catalog/products/new.jsx',
  'catalog/products/edit.jsx',
  'catalog/categories/index.jsx',
  'catalog/brands/index.jsx',
  'catalog/manufacturers/index.jsx',
  'catalog/salts/index.jsx',

  // Inventory
  'inventory/batches/detail.jsx',
  'inventory/adjustments/index.jsx',
  'inventory/low-stock/index.jsx',
  'inventory/expiry/index.jsx',

  // Purchases
  'purchases/index.jsx',
  'purchases/detail.jsx',
  'purchases/receive.jsx',
  'purchases/suppliers/index.jsx',
  'purchases/suppliers/detail.jsx',

  // Customers
  'customers/detail.jsx',
  'medicine-requests/detail.jsx',

  // Coupons
  'coupons/new.jsx',
  'coupons/edit.jsx',

  // Staff & Access
  'staff/index.jsx',
  'staff/new.jsx',
  'staff/edit.jsx',
  'roles/index.jsx',
  'permissions/index.jsx',

  // Misc
  'notifications/index.jsx',
  'analytics/index.jsx',
  'reports/orders.jsx',
  'reports/users.jsx',
  'reports/inventory.jsx',
  'audit/index.jsx',
  'settings/index.jsx',
];

const template = (title) => `import React from "react";
import Card from "@/components/ui/Card";

const ${title.replace(/[^a-zA-Z0-9]/g, '')} = () => {
  return (
    <div>
      <Card title="${title.replace(/-/g, ' ').toUpperCase()}">
        <div className="flex justify-center items-center h-40 text-slate-500">
          <p>API not available yet. This page is currently under construction.</p>
        </div>
      </Card>
    </div>
  );
};

export default ${title.replace(/[^a-zA-Z0-9]/g, '')};
`;

pagesToCreate.forEach(pagePath => {
  const fullPath = path.join(pagesDir, pagePath);
  const dirName = path.dirname(fullPath);

  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
  }

  if (!fs.existsSync(fullPath)) {
    // Generate component name from path
    let title = path.basename(pagePath, '.jsx');
    if (title === 'index') {
      title = path.basename(dirName);
    }
    const parts = pagePath.split('/');
    if (parts.length > 1 && title !== parts[parts.length - 2]) {
      title = parts[parts.length - 2] + ' ' + title;
    }

    fs.writeFileSync(fullPath, template(title));
    console.log(`Created: ${pagePath}`);
  }
});
