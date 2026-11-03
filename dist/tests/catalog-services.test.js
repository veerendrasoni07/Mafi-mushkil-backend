"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = require("../app");
const env_1 = require("../config/env");
const seed_1 = require("../database/seed");
const catalog_models_1 = require("../modules/catalog/catalog.models");
(0, node_test_1.describe)('7 Services, Sub-services, Complaint Management & Admin Hierarchy', () => {
    let server;
    let baseUrl;
    let adminToken;
    let customerToken;
    let customerUser;
    (0, node_test_1.before)(async () => {
        const uri = process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || env_1.config.mongoUri;
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(uri);
        }
        // Clean up any sub-services and complaint types added in prior test runs
        await catalog_models_1.CategoryModel.deleteMany({ title: { $in: ['Mesh Network Extension', 'Whole-Home Mesh Extension'] } });
        await catalog_models_1.ComplaintTypeModel.deleteMany({ title: 'SSID Not Broadcasting' });
        const app = (0, app_1.createApp)();
        server = app.listen(0);
        const address = server.address();
        baseUrl = `http://localhost:${address.port}/api/v1`;
        // 1. Initial idempotent seed
        await (0, seed_1.seedDatabase)();
        // 2. Run seed a SECOND time to prove idempotency
        await (0, seed_1.seedDatabase)();
        // Log in admin
        const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@mafimushkil.com', password: 'password123' }),
        });
        const adminData = (await adminLoginRes.json());
        adminToken = adminData.data.tokens.accessToken;
        // Log in customer (Priya)
        const custLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'priya@mafimushkil.com', password: 'password123' }),
        });
        const custData = (await custLoginRes.json());
        customerToken = custData.data.tokens.accessToken;
        customerUser = custData.data.user;
    });
    (0, node_test_1.after)(async () => {
        await catalog_models_1.CategoryModel.deleteMany({ title: { $in: ['Mesh Network Extension', 'Whole-Home Mesh Extension'] } });
        await catalog_models_1.ComplaintTypeModel.deleteMany({ title: 'SSID Not Broadcasting' });
        if (server)
            server.close();
        await mongoose_1.default.disconnect();
    });
    async function api(path, options = {}) {
        const url = `${baseUrl}${path}`;
        const headers = {
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
    (0, node_test_1.test)('1. Verify 7 services seeded idempotently without duplicates', async () => {
        const expectedSlugs = [
            'computers-laptops',
            'cctv-surveillance',
            'printers-scanners',
            'servers-networking',
            'epabx-biometric',
            'wifi-services',
            'amc-contracts',
        ];
        const seededServices = await catalog_models_1.ServiceModel.find({ slug: { $in: expectedSlugs } }).sort({ sortOrder: 1 });
        strict_1.default.equal(seededServices.length, 7, 'Must have exactly 7 required services');
        strict_1.default.deepEqual(seededServices.map((s) => s.slug), expectedSlugs);
    });
    (0, node_test_1.test)('2. Verify sub-services and complaint types for each of the 7 services', async () => {
        const expectedSlugs = [
            'computers-laptops',
            'cctv-surveillance',
            'printers-scanners',
            'servers-networking',
            'epabx-biometric',
            'wifi-services',
            'amc-contracts',
        ];
        const services = await catalog_models_1.ServiceModel.find({ slug: { $in: expectedSlugs } });
        for (const service of services) {
            const subServices = await catalog_models_1.CategoryModel.find({ serviceId: service._id });
            const complaintTypes = await catalog_models_1.ComplaintTypeModel.find({ serviceId: service._id });
            strict_1.default.ok(subServices.length >= 3, `Service ${service.title} should have at least 3 sub-services`);
            strict_1.default.ok(complaintTypes.length >= 2, `Service ${service.title} should have at least 2 complaint types`);
        }
    });
    (0, node_test_1.test)('3. Public API: GET /catalog/services returns services with complaintTypes & complaintIssues', async () => {
        const res = await api('/catalog/services');
        strict_1.default.equal(res.status, 200);
        strict_1.default.ok(res.data.data.length >= 7);
        const comp = res.data.data.find((s) => s.slug === 'computers-laptops');
        strict_1.default.ok(comp, 'Computers & Laptops service found');
        strict_1.default.ok(comp.complaintTypes.length >= 4, 'Complaint types array present');
        strict_1.default.ok(comp.complaintIssues.includes('No Display'), 'Backward-compatible complaintIssues has No Display');
    });
    (0, node_test_1.test)('4. Public API: GET /catalog/services/:id/categories returns correct sub-services', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const res = await api(`/catalog/services/${comp._id}/categories`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.data.length, 5);
        const titles = res.data.data.map((c) => c.title);
        strict_1.default.ok(titles.includes('Buy New Desktop/Laptop'));
        strict_1.default.ok(titles.includes('Hardware Repair'));
        strict_1.default.ok(titles.includes('Windows/Software Updates'));
        strict_1.default.ok(titles.includes('OS Installation'));
        strict_1.default.ok(titles.includes('Upgradation'));
    });
    (0, node_test_1.test)('5. Public API: GET /catalog/services/:id/complaint-types returns complaint types separately', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const res = await api(`/catalog/services/${comp._id}/complaint-types`);
        strict_1.default.equal(res.status, 200);
        strict_1.default.equal(res.data.data.length, 4);
        const titles = res.data.data.map((ct) => ct.title);
        strict_1.default.ok(titles.includes('No Display'));
        strict_1.default.ok(titles.includes('Overheating'));
        strict_1.default.ok(titles.includes('Slow Performance'));
        strict_1.default.ok(titles.includes('Virus/Malware Issues'));
    });
    (0, node_test_1.test)('6. Normal booking: Customer creates booking using service ID and sub-service ID', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const repair = await catalog_models_1.CategoryModel.findOne({ serviceId: comp._id, slug: 'hardware-repair' });
        const res = await api('/requests', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: {
                serviceId: comp._id.toString(),
                categoryId: repair._id.toString(),
                problemDescription: 'My laptop fan is noisy and overheating on boot',
                address: 'Worli, Mumbai',
            },
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.data.data.serviceId, comp._id.toString());
        strict_1.default.equal(res.data.data.categoryId, repair._id.toString());
        strict_1.default.ok(res.data.data.snapshotTitle.includes('Hardware Repair'));
    });
    (0, node_test_1.test)('7. Validation: Complaint types cannot accidentally be submitted as normal booking sub-services', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const noDisplayComplaint = await catalog_models_1.ComplaintTypeModel.findOne({ serviceId: comp._id, title: 'No Display' });
        const res = await api('/requests', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: {
                serviceId: comp._id.toString(),
                categoryId: noDisplayComplaint._id.toString(), // mistakenly passed complaint type ID as sub-service
                problemDescription: 'Screen is black',
                address: 'Worli, Mumbai',
            },
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.data.error.code, 'INVALID_SUB_SERVICE');
    });
    (0, node_test_1.test)('8. Complaint registration: Customer registers complaint with service ID and complaint type ID', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const noDisplay = await catalog_models_1.ComplaintTypeModel.findOne({ serviceId: comp._id, title: 'No Display' });
        const res = await api('/complaints', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: {
                serviceId: comp._id.toString(),
                complaintTypeId: noDisplay._id.toString(),
                description: 'Screen does not turn on even after power LED is lit',
            },
        });
        strict_1.default.equal(res.status, 201);
        strict_1.default.equal(res.data.data.serviceId, comp._id.toString());
        strict_1.default.equal(res.data.data.complaintTypeId, noDisplay._id.toString());
        strict_1.default.equal(res.data.data.serviceTitleSnapshot, 'Computers & Laptops');
        strict_1.default.equal(res.data.data.issueCategory, 'No Display');
    });
    (0, node_test_1.test)('9. Validation: Sub-services cannot accidentally be submitted as complaint types', async () => {
        const comp = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const repair = await catalog_models_1.CategoryModel.findOne({ serviceId: comp._id, slug: 'hardware-repair' });
        const res = await api('/complaints', {
            method: 'POST',
            headers: { Authorization: `Bearer ${customerToken}` },
            body: {
                serviceId: comp._id.toString(),
                complaintTypeId: repair._id.toString(), // mistakenly passed sub-service as complaint type
                description: 'Need repair done',
            },
        });
        strict_1.default.equal(res.status, 400);
        strict_1.default.equal(res.data.error.code, 'INVALID_COMPLAINT_TYPE');
    });
    (0, node_test_1.test)('10. Admin: Manage Service categories (View, Edit, Activate/Deactivate)', async () => {
        // View admin services
        const listRes = await api('/catalog/admin/services', {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        strict_1.default.equal(listRes.status, 200);
        strict_1.default.ok(listRes.data.data.length >= 7);
        const compService = listRes.data.data.find((s) => s.slug === 'computers-laptops');
        strict_1.default.equal(compService.subServicesCount, 5);
        strict_1.default.equal(compService.complaintTypesCount, 4);
        // Edit service
        const updateRes = await api(`/catalog/admin/services/${compService.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { iconKey: 'laptop' },
        });
        strict_1.default.equal(updateRes.status, 200);
        strict_1.default.equal(updateRes.data.data.iconKey, 'laptop');
        // Deactivate service
        const deactRes = await api(`/catalog/admin/services/${compService.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { isActive: false },
        });
        strict_1.default.equal(deactRes.status, 200);
        strict_1.default.equal(deactRes.data.data.isActive, false);
        // Verify it doesn't appear in public active services
        const pubRes = await api('/catalog/services');
        strict_1.default.ok(!pubRes.data.data.some((s) => s.id === compService.id));
        // Re-activate
        await api(`/catalog/admin/services/${compService.id}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { isActive: true },
        });
    });
    (0, node_test_1.test)('11. Admin: Manage Sub-services and Complaint types under a service', async () => {
        const wifi = await catalog_models_1.ServiceModel.findOne({ slug: 'wifi-services' });
        // Admin adds new sub-service
        const addCatRes = await api(`/catalog/admin/services/${wifi._id}/categories`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { title: 'Mesh Network Extension' },
        });
        strict_1.default.equal(addCatRes.status, 201);
        const newCatId = addCatRes.data.data._id;
        // Admin updates sub-service
        const updateCatRes = await api(`/catalog/admin/categories/${newCatId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { title: 'Whole-Home Mesh Extension' },
        });
        strict_1.default.equal(updateCatRes.status, 200);
        // Admin adds new complaint type
        const addCtRes = await api(`/catalog/admin/services/${wifi._id}/complaint-types`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { title: 'SSID Not Broadcasting' },
        });
        strict_1.default.equal(addCtRes.status, 201);
        const newCtId = addCtRes.data.data._id;
        // Admin deactivates complaint type
        const deactCtRes = await api(`/catalog/admin/complaint-types/${newCtId}/status`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { isActive: false },
        });
        strict_1.default.equal(deactCtRes.status, 200);
        strict_1.default.equal(deactCtRes.data.data.isActive, false);
    });
});
