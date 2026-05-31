import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf-8');

// Add dummy users
const dummyUsersStr = `
for (let i = 0; i < 15; i++) {
  users.push({
    id: \`u_dummy_\${i}\`,
    name: \`User \${i}\`,
    email: \`user\${i}@example.com\`,
    password: "password",
    role: "user",
    savedProductIds: [products[Math.floor(Math.random() * products.length)]?.id],
    loyaltyPoints: Math.floor(Math.random() * 1000)
  });
}
`;

// Add dummy coupons
const dummyCouponsStr = `
coupons.push(
  { id: "cp2", code: "SUMMER", discountPercentage: 15, isActive: true, applicableProductIds: [] },
  { id: "cp3", code: "FLASH50", discountPercentage: 5, isActive: false, applicableProductIds: [] }
);
`;

const dummySupportStr = `
for (let i = 0; i < 12; i++) {
  supportTickets.push({
    id: \`sup_\${i}\`,
    productId: products[Math.floor(Math.random() * products.length)]?.id,
    email: \`user\${i}@example.com\`,
    question: "Is this compatible with my current build?",
    status: Math.random() > 0.5 ? 'Open' : 'Closed',
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
  });
}
`;

const dummyRestockStr = `
for (let i = 0; i < 8; i++) {
  restockRequests.push({
    id: \`res_\${i}\`,
    productId: products[Math.floor(Math.random() * products.length)]?.id,
    userId: \`u_dummy_\${i}\`,
    status: 'Pending',
    createdAt: new Date(Date.now() - Math.random() * 8000000000).toISOString()
  });
}
`;

// Inject into server.ts right after `const statuses = ...`
const lines = content.split('\n');

const injectIndex = lines.findIndex(l => l.includes('const statuses: Array<Order["status"]>'));
if (injectIndex !== -1) {
    lines.splice(injectIndex + 1, 0, dummyUsersStr, dummyCouponsStr, dummySupportStr, dummyRestockStr);
}

// Modify products initialization
const prodIndex = lines.findIndex(l => l.includes('let products: Product[] = demoProducts.map'));
if (prodIndex !== -1) {
  let prodEnd = lines.findIndex((l, i) => i > prodIndex && l.includes('}));'));
  if (prodEnd !== -1) {
    lines[prodEnd] = `  code: p.code || \`PRD-\${10000 + i}\`,\n  reviews: Array.from({ length: Math.floor(Math.random() * 6) }).map((_, rIdx) => ({ id: \`rev_\${i}_\${rIdx}\`, userId: \`u_dummy_\${Math.floor(Math.random()*15)}\`, userName: \`Tester \${rIdx}\`, rating: 3 + Math.floor(Math.random() * 3), comment: "Awesome performance for the price. Highly recommended!", createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString() }))\n}));`;
  }
}

fs.writeFileSync('server.ts', lines.join('\n'));
console.log('Modified server.ts');
