const jwt = require('jsonwebtoken');
const secret = 'finflow_access_secret_change_in_production';
const payload = {
  sub: 'test-user-001',
  email: 'test@finflow.com',
  role: 'BANK_CUSTOMER',
  tenantId: 'tenant-001',
};
const token = jwt.sign(payload, secret, { expiresIn: '1d' });
console.log(token);
