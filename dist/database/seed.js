"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("../modules/users/user.model");
const catalog_models_1 = require("../modules/catalog/catalog.models");
const request_model_1 = require("../modules/requests/request.model");
const notification_model_1 = require("../modules/notifications/notification.model");
const promotion_model_1 = require("../modules/promotions/promotion.model");
const roles_1 = require("../shared/constants/roles");
const status_1 = require("../shared/constants/status");
async function seedDatabase() {
    console.log('[Seed] Checking and seeding database records from PDF design...');
    // 1. SEED USERS
    const existingUsers = await user_model_1.UserModel.countDocuments();
    if (existingUsers === 0) {
        console.log('[Seed] Seeding Users...');
        const defaultPasswordHash = await bcryptjs_1.default.hash('password123', 10);
        const users = await user_model_1.UserModel.insertMany([
            {
                name: 'Priya',
                email: 'priya@mafimushkil.com',
                phone: '+919876543210',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.CUSTOMER,
                avatarInitial: 'P',
                isActive: true,
                mustChangePassword: false,
            },
            {
                name: 'Arjun Rao',
                email: 'arjun@mafimushkil.com',
                phone: '+919811122233',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.CUSTOMER,
                avatarInitial: 'A',
                isActive: true,
                mustChangePassword: false,
            },
            {
                name: 'Mafi Mushkil Admin',
                email: 'admin@mafimushkil.com',
                phone: '+919999900000',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.ADMIN,
                avatarInitial: 'M',
                isActive: true,
                mustChangePassword: false,
            },
            {
                name: 'Rahul Patil',
                email: 'rahul@mafimushkil.com',
                phone: '+919800011111',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.ENGINEER,
                avatarInitial: 'R',
                isActive: true,
                mustChangePassword: false,
            },
            {
                name: 'Sneha Kulkarni',
                email: 'sneha@mafimushkil.com',
                phone: '+919800022222',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.ENGINEER,
                avatarInitial: 'S',
                isActive: true,
                mustChangePassword: false,
            },
            {
                name: 'Amit Shah',
                email: 'amit@mafimushkil.com',
                phone: '+919800033333',
                passwordHash: defaultPasswordHash,
                role: roles_1.UserRole.ENGINEER,
                avatarInitial: 'A',
                isActive: true,
                mustChangePassword: false,
            },
        ]);
        console.log(`[Seed] Seeded ${users.length} users.`);
    }
    // 2. SEED CATALOG (7 Client Services, Sub-services, Products)
    const existingServices = await catalog_models_1.ServiceModel.countDocuments();
    if (existingServices === 0) {
        console.log('[Seed] Seeding 7 Client Services...');
        const services = await catalog_models_1.ServiceModel.insertMany([
            {
                title: 'Computers & Laptops',
                slug: 'computers-laptops',
                iconKey: 'computer',
                sortOrder: 1,
                complaintIssues: ['No Display', 'Overheating', 'Slow Performance', 'Virus/Malware Issues'],
            },
            {
                title: 'CCTV & Surveillance Systems',
                slug: 'cctv-surveillance',
                iconKey: 'cctv',
                sortOrder: 2,
                complaintIssues: ['Camera Not Working', 'No Recording', 'Night Vision Failure', 'Live Feed Errors'],
            },
            {
                title: 'Printers & Scanners',
                slug: 'printers-scanners',
                iconKey: 'printer',
                sortOrder: 3,
                complaintIssues: ['Printing Quality Issues', 'Scanner Not Connecting', 'Printer Not Turning On'],
            },
            {
                title: 'Servers & Networking Solutions',
                slug: 'servers-networking',
                iconKey: 'server',
                sortOrder: 4,
                complaintIssues: ['No Internet', 'Internet Drops', 'Wi-Fi Range Issues', 'Network Not Working'],
            },
            {
                title: 'EPABX Systems & Biometric Machines',
                slug: 'epabx-biometric',
                iconKey: 'biometric',
                sortOrder: 5,
                complaintIssues: ['Calls Not Connecting', 'Machine Not Recognizing Face/Fingerprint', 'Power Issues'],
            },
            {
                title: 'Wi-Fi Services',
                slug: 'wifi-services',
                iconKey: 'wifi',
                sortOrder: 6,
                complaintIssues: ['No Internet', 'Low Speed', 'Frequent Disconnections', 'Wi-Fi Range Issues'],
            },
            {
                title: 'Annual Maintenance Contracts (AMC)',
                slug: 'amc-contracts',
                iconKey: 'amc',
                sortOrder: 7,
                complaintIssues: ['Scheduled Visit Delay', 'Contract Coverage Inquiry'],
            },
        ]);
        const compService = services.find((s) => s.slug === 'computers-laptops');
        const cctvService = services.find((s) => s.slug === 'cctv-surveillance');
        const printService = services.find((s) => s.slug === 'printers-scanners');
        const netService = services.find((s) => s.slug === 'servers-networking');
        const epabxService = services.find((s) => s.slug === 'epabx-biometric');
        const wifiService = services.find((s) => s.slug === 'wifi-services');
        const amcService = services.find((s) => s.slug === 'amc-contracts');
        console.log('[Seed] Seeding Sub-services (Categories)...');
        const categories = await catalog_models_1.CategoryModel.insertMany([
            // 1. Computers & Laptops
            { serviceId: compService._id, title: 'Buy New Desktop/Laptop', slug: 'buy-desktop-laptop', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: compService._id, title: 'Hardware Repair', slug: 'hardware-repair', iconKey: 'build', sortOrder: 2 },
            { serviceId: compService._id, title: 'Windows/Software Updates', slug: 'windows-software-updates', iconKey: 'software_update', sortOrder: 3 },
            { serviceId: compService._id, title: 'OS Installation', slug: 'os-installation', iconKey: 'os_install', sortOrder: 4 },
            { serviceId: compService._id, title: 'Upgradation', slug: 'upgradation', iconKey: 'upgrade', sortOrder: 5 },
            // 2. CCTV & Surveillance Systems
            { serviceId: cctvService._id, title: 'Buy New CCTV System', slug: 'buy-cctv-system', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: cctvService._id, title: 'New Installation', slug: 'new-installation', iconKey: 'build', sortOrder: 2 },
            { serviceId: cctvService._id, title: 'Regular Maintenance', slug: 'regular-maintenance', iconKey: 'maintenance', sortOrder: 3 },
            { serviceId: cctvService._id, title: 'System Upgradation', slug: 'system-upgradation', iconKey: 'upgrade', sortOrder: 4 },
            { serviceId: cctvService._id, title: 'Cable Wiring', slug: 'cable-wiring', iconKey: 'cable', sortOrder: 5 },
            // 3. Printers & Scanners
            { serviceId: printService._id, title: 'Buy New Printer', slug: 'buy-new-printer', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: printService._id, title: 'Repair Printer', slug: 'repair-printer', iconKey: 'build', sortOrder: 2 },
            { serviceId: printService._id, title: 'Toner/Cartridge Refill', slug: 'toner-cartridge-refill', iconKey: 'refill', sortOrder: 3 },
            { serviceId: printService._id, title: 'Paper Jam Repair', slug: 'paper-jam-repair', iconKey: 'paper_jam', sortOrder: 4 },
            { serviceId: printService._id, title: 'Network Printer Setup', slug: 'network-printer-setup', iconKey: 'networking', sortOrder: 5 },
            // 4. Servers & Networking Solutions
            { serviceId: netService._id, title: 'Buy New Networking Hardware', slug: 'buy-networking-hardware', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: netService._id, title: 'Router Configuration', slug: 'router-configuration', iconKey: 'router', sortOrder: 2 },
            { serviceId: netService._id, title: 'LAN Wiring', slug: 'lan-wiring', iconKey: 'cable', sortOrder: 3 },
            { serviceId: netService._id, title: 'Wi-Fi Setup', slug: 'wifi-setup', iconKey: 'wifi', sortOrder: 4 },
            { serviceId: netService._id, title: 'Server Rack Management', slug: 'server-rack-management', iconKey: 'server', sortOrder: 5 },
            // 5. EPABX Systems & Biometric Machines
            { serviceId: epabxService._id, title: 'Buy New EPABX/Biometric System', slug: 'buy-epabx-biometric', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: epabxService._id, title: 'Calling System Setup', slug: 'calling-system-setup', iconKey: 'phone', sortOrder: 2 },
            { serviceId: epabxService._id, title: 'Biometric Installation', slug: 'biometric-installation', iconKey: 'fingerprint', sortOrder: 3 },
            { serviceId: epabxService._id, title: 'Access Control Management', slug: 'access-control-management', iconKey: 'security', sortOrder: 4 },
            // 6. Wi-Fi Services
            { serviceId: wifiService._id, title: 'Buy New Wi-Fi Connection', slug: 'buy-wifi-connection', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: wifiService._id, title: 'Plan Upgrade', slug: 'plan-upgrade', iconKey: 'upgrade', sortOrder: 2 },
            { serviceId: wifiService._id, title: 'Wi-Fi Setup/Installation', slug: 'wifi-setup-installation', iconKey: 'wifi', sortOrder: 3 },
            { serviceId: wifiService._id, title: 'Router/Modem Repair', slug: 'router-modem-repair', iconKey: 'build', sortOrder: 4 },
            // 7. Annual Maintenance Contracts (AMC)
            { serviceId: amcService._id, title: 'Buy New AMC Plan', slug: 'buy-amc-plan', iconKey: 'shopping_bag', sortOrder: 1 },
            { serviceId: amcService._id, title: 'AMC Renewal', slug: 'amc-renewal', iconKey: 'renewal', sortOrder: 2 },
            { serviceId: amcService._id, title: 'Request Scheduled Maintenance', slug: 'request-scheduled-maintenance', iconKey: 'maintenance', sortOrder: 3 },
        ]);
        const buyCompCat = categories.find((c) => c.slug === 'buy-desktop-laptop');
        const repairCompCat = categories.find((c) => c.slug === 'hardware-repair');
        const buyCctvCat = categories.find((c) => c.slug === 'buy-cctv-system');
        console.log('[Seed] Seeding Products & Service Packages...');
        await catalog_models_1.ProductModel.insertMany([
            {
                serviceId: compService._id,
                categoryId: buyCompCat._id,
                title: 'Core i5 Office Desktop Setup',
                description: 'Intel Core i5, 16GB RAM, 512GB NVMe SSD, 22-inch HD Monitor with Windows 11 Pro.',
                priceMinorUnits: 3499900,
                currency: 'INR',
                imageKey: 'desktop_setup',
                sortOrder: 1,
            },
            {
                serviceId: compService._id,
                categoryId: buyCompCat._id,
                title: 'Business Laptop 16GB RAM',
                description: 'Ultra-thin business laptop with 15.6-inch FHD display, fast battery charging & SSD.',
                priceMinorUnits: 4850000,
                currency: 'INR',
                imageKey: 'laptop_business',
                sortOrder: 2,
            },
            {
                serviceId: compService._id,
                categoryId: repairCompCat._id,
                title: 'Diagnostic & Chipset Repair',
                description: 'In-depth motherboard & component troubleshooting, heat sink cleaning and repair.',
                priceMinorUnits: 79900,
                currency: 'INR',
                imageKey: 'chipset_repair',
                sortOrder: 1,
            },
            {
                serviceId: cctvService._id,
                categoryId: buyCctvCat._id,
                title: '4-Channel HD Dome CCTV System',
                description: 'Includes 4 HD dome cameras, 1TB surveillance hard drive, 4-channel DVR and power supply.',
                priceMinorUnits: 1299900,
                currency: 'INR',
                imageKey: 'cctv_kit_4ch',
                sortOrder: 1,
            },
            {
                serviceId: cctvService._id,
                categoryId: buyCctvCat._id,
                title: '8-Channel 5MP Surveillance System',
                description: 'Ultra HD 5MP outdoor & indoor kit with remote phone streaming and night vision.',
                priceMinorUnits: 2499900,
                currency: 'INR',
                imageKey: 'cctv_kit_8ch',
                sortOrder: 2,
            },
        ]);
    }
    // 3. SEED REQUESTS
    const existingRequests = await request_model_1.ServiceRequestModel.countDocuments();
    if (existingRequests === 0) {
        console.log('[Seed] Seeding Service Requests...');
        const priya = await user_model_1.UserModel.findOne({ phone: '+919876543210' });
        const arjun = await user_model_1.UserModel.findOne({ phone: '+919811122233' });
        const owner = await user_model_1.UserModel.findOne({ role: { $in: [roles_1.UserRole.ADMIN, roles_1.UserRole.OWNER] } });
        const rahul = await user_model_1.UserModel.findOne({ name: 'Rahul Patil' });
        const sneha = await user_model_1.UserModel.findOne({ name: 'Sneha Kulkarni' });
        const cctvService = await catalog_models_1.ServiceModel.findOne({ slug: 'cctv-surveillance' });
        const compService = await catalog_models_1.ServiceModel.findOne({ slug: 'computers-laptops' });
        const printService = await catalog_models_1.ServiceModel.findOne({ slug: 'printers-scanners' });
        const wifiService = await catalog_models_1.ServiceModel.findOne({ slug: 'wifi-services' });
        if (priya && arjun && owner && rahul && sneha && cctvService && compService && printService && wifiService) {
            await request_model_1.ServiceRequestModel.insertMany([
                {
                    requestNumber: '#103',
                    customerId: arjun._id,
                    customerNameSnapshot: arjun.name,
                    customerPhoneSnapshot: arjun.phone,
                    serviceId: wifiService._id,
                    snapshotTitle: 'Wi-Fi Services',
                    problemDescription: 'Frequent disconnects and high ping during office hours',
                    address: 'Powai, Mumbai',
                    status: status_1.RequestStatus.OPEN,
                    statusHistory: [
                        {
                            status: status_1.RequestStatus.OPEN,
                            changedBy: arjun._id,
                            changedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                            note: 'Created by customer',
                        },
                    ],
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                },
                {
                    requestNumber: '#102',
                    customerId: priya._id,
                    customerNameSnapshot: priya.name,
                    customerPhoneSnapshot: priya.phone,
                    serviceId: printService._id,
                    snapshotTitle: 'Printers & Scanners',
                    problemDescription: 'Printer paper jam repair and toner refill needed',
                    address: 'Bandra, Mumbai',
                    status: status_1.RequestStatus.OPEN,
                    statusHistory: [
                        {
                            status: status_1.RequestStatus.OPEN,
                            changedBy: priya._id,
                            changedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                            note: 'Created by customer',
                        },
                    ],
                    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                },
                {
                    requestNumber: '#101',
                    customerId: priya._id,
                    customerNameSnapshot: priya.name,
                    customerPhoneSnapshot: priya.phone,
                    serviceId: cctvService._id,
                    snapshotTitle: 'CCTV & Surveillance Systems',
                    problemDescription: 'Install 4 CCTV cameras for shop',
                    address: 'Andheri West, Mumbai',
                    status: status_1.RequestStatus.ASSIGNED,
                    assignedEngineerId: rahul._id,
                    assignedEngineerNameSnapshot: rahul.name,
                    assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    statusHistory: [
                        {
                            status: status_1.RequestStatus.OPEN,
                            changedBy: priya._id,
                            changedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
                            note: 'Created by customer',
                        },
                        {
                            status: status_1.RequestStatus.ASSIGNED,
                            changedBy: owner._id,
                            changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            note: `Assigned to ${rahul.name}`,
                        },
                    ],
                    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
                },
                {
                    requestNumber: '#099',
                    customerId: priya._id,
                    customerNameSnapshot: priya.name,
                    customerPhoneSnapshot: priya.phone,
                    serviceId: compService._id,
                    snapshotTitle: 'Computers & Laptops',
                    problemDescription: 'No display and power blinking on desktop PC',
                    address: 'Bandra, Mumbai',
                    status: status_1.RequestStatus.RESOLVED,
                    assignedEngineerId: sneha._id,
                    assignedEngineerNameSnapshot: sneha.name,
                    assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                    statusHistory: [
                        {
                            status: status_1.RequestStatus.OPEN,
                            changedBy: priya._id,
                            changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                        },
                        {
                            status: status_1.RequestStatus.ASSIGNED,
                            changedBy: owner._id,
                            changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                        },
                        {
                            status: status_1.RequestStatus.RESOLVED,
                            changedBy: sneha._id,
                            changedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                        },
                    ],
                    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
                },
                {
                    requestNumber: '#087',
                    customerId: arjun._id,
                    customerNameSnapshot: arjun.name,
                    customerPhoneSnapshot: arjun.phone,
                    serviceId: cctvService._id,
                    snapshotTitle: 'CCTV & Surveillance Systems',
                    problemDescription: 'Wi-Fi camera offline and red light blinking',
                    address: 'Powai, Mumbai',
                    status: status_1.RequestStatus.RESOLVED,
                    assignedEngineerId: rahul._id,
                    assignedEngineerNameSnapshot: rahul.name,
                    assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                },
            ]);
        }
    }
    // 4. SEED NOTIFICATIONS (matching PDF screen 12)
    const existingNotifications = await notification_model_1.NotificationModel.countDocuments();
    if (existingNotifications === 0) {
        const priya = await user_model_1.UserModel.findOne({ phone: '+919876543210' });
        if (priya) {
            await notification_model_1.NotificationModel.insertMany([
                {
                    recipientUserId: priya._id,
                    title: 'Engineer Assigned',
                    body: 'Rahul Patil is assigned to your Camera Install request.',
                    type: notification_model_1.NotificationType.ASSIGNMENT,
                    isRead: false,
                    createdAt: new Date(Date.now() - 30 * 60 * 1000), // Today
                },
                {
                    recipientUserId: priya._id,
                    title: 'Request Resolved',
                    body: 'Your PC Repair request #099 is resolved. Please rate us!',
                    type: notification_model_1.NotificationType.RESOLUTION,
                    isRead: false,
                    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Today
                },
                {
                    recipientUserId: priya._id,
                    title: 'Special Promotion',
                    body: '20% OFF on your first camera installation.',
                    type: notification_model_1.NotificationType.PROMOTION,
                    isRead: true,
                    readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                },
            ]);
        }
    }
    // 5. SEED PROMOTIONS
    const existingPromotions = await promotion_model_1.PromotionModel.countDocuments();
    if (existingPromotions === 0) {
        await promotion_model_1.PromotionModel.insertMany([
            {
                title: '20% OFF on your first camera installation',
                description: 'Get an exclusive 20% discount on professional CCTV camera setup & installation for your home or business.',
                discountPercentage: 20,
                serviceSlug: 'camera-install',
                isActive: true,
            },
            {
                title: 'Free Diagnostic with PC Repair',
                description: 'Complimentary hardware inspection and system health checkup with every PC diagnostic service.',
                discountPercentage: 100,
                serviceSlug: 'pc-repair',
                isActive: true,
            },
        ]);
    }
    console.log('[Seed] Database initialization and seeding complete!');
}
// Execute standalone only when directly executed via CLI (e.g. npm run seed)
if (process.argv[1]?.includes('seed')) {
    (async () => {
        try {
            const { connectDatabase, disconnectDatabase } = await Promise.resolve().then(() => __importStar(require('../config/database')));
            console.log('[Seed] Connecting to database for manual seeding...');
            await connectDatabase();
            await seedDatabase();
            await disconnectDatabase();
            console.log('[Seed] Standalone seeding completed successfully.');
            process.exit(0);
        }
        catch (err) {
            console.error('[Seed] Standalone seeding failed:', err);
            process.exit(1);
        }
    })();
}
