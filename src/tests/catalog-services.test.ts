import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { config } from '../config/env';
import { seedDatabase } from '../database/seed';
import { UserModel } from '../modules/users/user.model';
import { ServiceModel, CategoryModel, ComplaintTypeModel } from '../modules/catalog/catalog.models';
import { UserRole } from '../shared/constants/roles';
import bcrypt from 'bcryptjs';

describe('7 Services, Sub-services, Complaint Management & Admin Hierarchy', () => {
  let server: http.Server;
  let baseUrl: string;

  let adminToken: string;
  let customerToken: string;
  let customerUser: any;

  before(async () => {
    const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || config.mongoUri;
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(uri);
    }

    // Clean up any sub-services and complaint types added in prior test runs
    await CategoryModel.deleteMany({ title: { $in: ['Mesh Network Extension', 'Whole-Home Mesh Extension'] } });
    await ComplaintTypeModel.deleteMany({ title: 'SSID Not Broadcasting' });

    const app = createApp();
    server = app.listen(0);
    const address = server.address() as any;
    baseUrl = `http://localhost:${address.port}/api/v1`;

    // 1. Initial idempotent seed
    await seedDatabase();

    // 2. Run seed a SECOND time to prove idempotency
    await seedDatabase();

    // Log in admin
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@mafimushkil.com', password: 'password123' }),
    });
    const adminData = (await adminLoginRes.json()) as any;
    adminToken = adminData.data.tokens.accessToken;

    // Log in customer (Priya)
    const custLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@mafimushkil.com', password: 'password123' }),
    });
    const custData = (await custLoginRes.json()) as any;
    customerToken = custData.data.tokens.accessToken;
    customerUser = custData.data.user;
  });

  after(async () => {
    await CategoryModel.deleteMany({ title: { $in: ['Mesh Network Extension', 'Whole-Home Mesh Extension'] } });
    await ComplaintTypeModel.deleteMany({ title: 'SSID Not Broadcasting' });
    if (server) server.close();
    await mongoose.disconnect();
  });

  async function api(path: string, options: any = {}): Promise<{ status: number; ok: boolean; data: any }> {
    const url = `${baseUrl}${path}`;
    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const res = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, data };
  }

  test('1. Verify 7 services seeded idempotently without duplicates', async () => {
    const expectedSlugs = [
      'computers-laptops',
      'cctv-surveillance',
      'printers-scanners',
      'servers-networking',
      'epabx-biometric',
      'wifi-services',
      'amc-contracts',
    ];

    const seededServices = await ServiceModel.find({ slug: { $in: expectedSlugs } }).sort({ sortOrder: 1 });
    assert.equal(seededServices.length, 7, 'Must have exactly 7 required services');

    assert.deepEqual(
      seededServices.map((s) => s.slug),
      expectedSlugs
    );
  });

  test('2. Verify sub-services and complaint types for each of the 7 services', async () => {
    const expectedSlugs = [
      'computers-laptops',
      'cctv-surveillance',
      'printers-scanners',
      'servers-networking',
      'epabx-biometric',
      'wifi-services',
      'amc-contracts',
    ];
    const services = await ServiceModel.find({ slug: { $in: expectedSlugs } });
    for (const service of services) {
      const subServices = await CategoryModel.find({ serviceId: service._id });
      const complaintTypes = await ComplaintTypeModel.find({ serviceId: service._id });

      assert.ok(subServices.length >= 3, `Service ${service.title} should have at least 3 sub-services`);
      assert.ok(complaintTypes.length >= 2, `Service ${service.title} should have at least 2 complaint types`);
    }
  });

  test('3. Public API: GET /catalog/services returns services with complaintTypes & complaintIssues', async () => {
    const res = await api('/catalog/services');
    assert.equal(res.status, 200);
    assert.ok(res.data.data.length >= 7);

    const comp = res.data.data.find((s: any) => s.slug === 'computers-laptops');
    assert.ok(comp, 'Computers & Laptops service found');
    assert.ok(comp.complaintTypes.length >= 4, 'Complaint types array present');
    assert.ok(comp.complaintIssues.includes('No Display'), 'Backward-compatible complaintIssues has No Display');
  });

  test('4. Public API: GET /catalog/services/:id/categories returns correct sub-services', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const res = await api(`/catalog/services/${comp!._id}/categories`);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.length, 5);

    const titles = res.data.data.map((c: any) => c.title);
    assert.ok(titles.includes('Buy New Desktop/Laptop'));
    assert.ok(titles.includes('Hardware Repair'));
    assert.ok(titles.includes('Windows/Software Updates'));
    assert.ok(titles.includes('OS Installation'));
    assert.ok(titles.includes('Upgradation'));
  });

  test('5. Public API: GET /catalog/services/:id/complaint-types returns complaint types separately', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const res = await api(`/catalog/services/${comp!._id}/complaint-types`);
    assert.equal(res.status, 200);
    assert.equal(res.data.data.length, 4);

    const titles = res.data.data.map((ct: any) => ct.title);
    assert.ok(titles.includes('No Display'));
    assert.ok(titles.includes('Overheating'));
    assert.ok(titles.includes('Slow Performance'));
    assert.ok(titles.includes('Virus/Malware Issues'));
  });

  test('6. Normal booking: Customer creates booking using service ID and sub-service ID', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const repair = await CategoryModel.findOne({ serviceId: comp!._id, slug: 'hardware-repair' });

    const res = await api('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        serviceId: comp!._id.toString(),
        categoryId: repair!._id.toString(),
        problemDescription: 'My laptop fan is noisy and overheating on boot',
        address: 'Worli, Mumbai',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.data.serviceId, comp!._id.toString());
    assert.equal(res.data.data.categoryId, repair!._id.toString());
    assert.ok(res.data.data.snapshotTitle.includes('Hardware Repair'));
  });

  test('7. Validation: Complaint types cannot accidentally be submitted as normal booking sub-services', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const noDisplayComplaint = await ComplaintTypeModel.findOne({ serviceId: comp!._id, title: 'No Display' });

    const res = await api('/requests', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        serviceId: comp!._id.toString(),
        categoryId: noDisplayComplaint!._id.toString(), // mistakenly passed complaint type ID as sub-service
        problemDescription: 'Screen is black',
        address: 'Worli, Mumbai',
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'INVALID_SUB_SERVICE');
  });

  test('8. Complaint registration: Customer registers complaint with service ID and complaint type ID', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const noDisplay = await ComplaintTypeModel.findOne({ serviceId: comp!._id, title: 'No Display' });

    const res = await api('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        serviceId: comp!._id.toString(),
        complaintTypeId: noDisplay!._id.toString(),
        description: 'Screen does not turn on even after power LED is lit',
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.data.data.serviceId, comp!._id.toString());
    assert.equal(res.data.data.complaintTypeId, noDisplay!._id.toString());
    assert.equal(res.data.data.serviceTitleSnapshot, 'Computers & Laptops');
    assert.equal(res.data.data.issueCategory, 'No Display');
  });

  test('9. Validation: Sub-services cannot accidentally be submitted as complaint types', async () => {
    const comp = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const repair = await CategoryModel.findOne({ serviceId: comp!._id, slug: 'hardware-repair' });

    const res = await api('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        serviceId: comp!._id.toString(),
        complaintTypeId: repair!._id.toString(), // mistakenly passed sub-service as complaint type
        description: 'Need repair done',
      },
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.error.code, 'INVALID_COMPLAINT_TYPE');
  });

  test('10. Admin: Manage Service categories (View, Edit, Activate/Deactivate)', async () => {
    // View admin services
    const listRes = await api('/catalog/admin/services', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(listRes.status, 200);
    assert.ok(listRes.data.data.length >= 7);

    const compService = listRes.data.data.find((s: any) => s.slug === 'computers-laptops');
    assert.equal(compService.subServicesCount, 5);
    assert.equal(compService.complaintTypesCount, 4);

    // Edit service
    const updateRes = await api(`/catalog/admin/services/${compService.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { iconKey: 'laptop' },
    });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.data.iconKey, 'laptop');

    // Deactivate service
    const deactRes = await api(`/catalog/admin/services/${compService.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assert.equal(deactRes.status, 200);
    assert.equal(deactRes.data.data.isActive, false);

    // Verify it doesn't appear in public active services
    const pubRes = await api('/catalog/services');
    assert.ok(!pubRes.data.data.some((s: any) => s.id === compService.id));

    // Re-activate
    await api(`/catalog/admin/services/${compService.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: true },
    });
  });

  test('11. Admin: Manage Sub-services and Complaint types under a service', async () => {
    const wifi = await ServiceModel.findOne({ slug: 'wifi-services' });

    // Admin adds new sub-service
    const addCatRes = await api(`/catalog/admin/services/${wifi!._id}/categories`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: 'Mesh Network Extension' },
    });
    assert.equal(addCatRes.status, 201);
    const newCatId = addCatRes.data.data._id;

    // Admin updates sub-service
    const updateCatRes = await api(`/catalog/admin/categories/${newCatId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: 'Whole-Home Mesh Extension' },
    });
    assert.equal(updateCatRes.status, 200);

    // Admin adds new complaint type
    const addCtRes = await api(`/catalog/admin/services/${wifi!._id}/complaint-types`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { title: 'SSID Not Broadcasting' },
    });
    assert.equal(addCtRes.status, 201);
    const newCtId = addCtRes.data.data._id;

    // Admin deactivates complaint type
    const deactCtRes = await api(`/catalog/admin/complaint-types/${newCtId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { isActive: false },
    });
    assert.equal(deactCtRes.status, 200);
    assert.equal(deactCtRes.data.data.isActive, false);
  });
});
