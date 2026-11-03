import bcrypt from 'bcryptjs';
import { UserModel } from '../modules/users/user.model';
import { ServiceModel, CategoryModel, ProductModel, ComplaintTypeModel } from '../modules/catalog/catalog.models';
import { ServiceRequestModel } from '../modules/requests/request.model';
import { NotificationModel, NotificationType } from '../modules/notifications/notification.model';
import { PromotionModel } from '../modules/promotions/promotion.model';
import { UserRole } from '../shared/constants/roles';
import { RequestStatus } from '../shared/constants/status';

export interface SubServiceDef {
  title: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
}

export interface ComplaintTypeDef {
  title: string;
  slug: string;
  sortOrder: number;
}

export interface ServiceDef {
  title: string;
  slug: string;
  iconKey: string;
  sortOrder: number;
  subServices: SubServiceDef[];
  complaintTypes: ComplaintTypeDef[];
}

export const CLIENT_SERVICES_CONFIG: ServiceDef[] = [
  // 1. Computers & Laptops
  {
    title: 'Computers & Laptops',
    slug: 'computers-laptops',
    iconKey: 'computer',
    sortOrder: 1,
    subServices: [
      { title: 'Buy New Desktop/Laptop', slug: 'buy-desktop-laptop', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'Hardware Repair', slug: 'hardware-repair', iconKey: 'build', sortOrder: 2 },
      { title: 'Windows/Software Updates', slug: 'windows-software-updates', iconKey: 'software_update', sortOrder: 3 },
      { title: 'OS Installation', slug: 'os-installation', iconKey: 'os_install', sortOrder: 4 },
      { title: 'Upgradation', slug: 'upgradation', iconKey: 'upgrade', sortOrder: 5 },
    ],
    complaintTypes: [
      { title: 'No Display', slug: 'no-display', sortOrder: 1 },
      { title: 'Overheating', slug: 'overheating', sortOrder: 2 },
      { title: 'Slow Performance', slug: 'slow-performance', sortOrder: 3 },
      { title: 'Virus/Malware Issues', slug: 'virus-malware-issues', sortOrder: 4 },
    ],
  },

  // 2. CCTV & Surveillance Systems
  {
    title: 'CCTV & Surveillance Systems',
    slug: 'cctv-surveillance',
    iconKey: 'cctv',
    sortOrder: 2,
    subServices: [
      { title: 'Buy New CCTV System', slug: 'buy-cctv-system', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'New Installation', slug: 'new-installation', iconKey: 'build', sortOrder: 2 },
      { title: 'Regular Maintenance', slug: 'regular-maintenance', iconKey: 'maintenance', sortOrder: 3 },
      { title: 'System Upgradation', slug: 'system-upgradation', iconKey: 'upgrade', sortOrder: 4 },
      { title: 'Cable Wiring', slug: 'cable-wiring', iconKey: 'cable', sortOrder: 5 },
    ],
    complaintTypes: [
      { title: 'Camera Not Working', slug: 'camera-not-working', sortOrder: 1 },
      { title: 'No Recording', slug: 'no-recording', sortOrder: 2 },
      { title: 'Night Vision Failure', slug: 'night-vision-failure', sortOrder: 3 },
      { title: 'Live Feed Errors', slug: 'live-feed-errors', sortOrder: 4 },
    ],
  },

  // 3. Printers & Scanners
  {
    title: 'Printers & Scanners',
    slug: 'printers-scanners',
    iconKey: 'printer',
    sortOrder: 3,
    subServices: [
      { title: 'Buy New Printer', slug: 'buy-new-printer', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'Repair Printer', slug: 'repair-printer', iconKey: 'build', sortOrder: 2 },
      { title: 'Toner/Cartridge Refill', slug: 'toner-cartridge-refill', iconKey: 'refill', sortOrder: 3 },
      { title: 'Paper Jam Repair', slug: 'paper-jam-repair', iconKey: 'paper_jam', sortOrder: 4 },
      { title: 'Network Printer Setup', slug: 'network-printer-setup', iconKey: 'networking', sortOrder: 5 },
    ],
    complaintTypes: [
      { title: 'Printing Quality Issues', slug: 'printing-quality-issues', sortOrder: 1 },
      { title: 'Scanner Not Connecting', slug: 'scanner-not-connecting', sortOrder: 2 },
      { title: 'Printer Not Turning On', slug: 'printer-not-turning-on', sortOrder: 3 },
    ],
  },

  // 4. Servers & Networking Solutions
  {
    title: 'Servers & Networking Solutions',
    slug: 'servers-networking',
    iconKey: 'server',
    sortOrder: 4,
    subServices: [
      { title: 'Buy New Networking Hardware', slug: 'buy-networking-hardware', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'Router Configuration', slug: 'router-configuration', iconKey: 'router', sortOrder: 2 },
      { title: 'LAN Wiring', slug: 'lan-wiring', iconKey: 'cable', sortOrder: 3 },
      { title: 'Wi-Fi Setup', slug: 'wifi-setup', iconKey: 'wifi', sortOrder: 4 },
      { title: 'Server Rack Management', slug: 'server-rack-management', iconKey: 'server', sortOrder: 5 },
    ],
    complaintTypes: [
      { title: 'No Internet', slug: 'servers-no-internet', sortOrder: 1 },
      { title: 'Internet Drops', slug: 'internet-drops', sortOrder: 2 },
      { title: 'Wi-Fi Range Issues', slug: 'servers-wifi-range-issues', sortOrder: 3 },
      { title: 'Network Not Working', slug: 'network-not-working', sortOrder: 4 },
    ],
  },

  // 5. EPABX Systems & Biometric Machines
  {
    title: 'EPABX Systems & Biometric Machines',
    slug: 'epabx-biometric',
    iconKey: 'biometric',
    sortOrder: 5,
    subServices: [
      { title: 'Buy New EPABX/Biometric System', slug: 'buy-epabx-biometric', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'Calling System Setup', slug: 'calling-system-setup', iconKey: 'phone', sortOrder: 2 },
      { title: 'Biometric Installation', slug: 'biometric-installation', iconKey: 'fingerprint', sortOrder: 3 },
      { title: 'Access Control Management', slug: 'access-control-management', iconKey: 'security', sortOrder: 4 },
    ],
    complaintTypes: [
      { title: 'Calls Not Connecting', slug: 'calls-not-connecting', sortOrder: 1 },
      { title: 'Machine Not Recognizing Face/Fingerprint', slug: 'machine-not-recognizing-face-fingerprint', sortOrder: 2 },
      { title: 'Power Issues', slug: 'power-issues', sortOrder: 3 },
    ],
  },

  // 6. Wi-Fi Services
  {
    title: 'Wi-Fi Services',
    slug: 'wifi-services',
    iconKey: 'wifi',
    sortOrder: 6,
    subServices: [
      { title: 'Buy New Wi-Fi Connection', slug: 'buy-wifi-connection', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'Plan Upgrade', slug: 'plan-upgrade', iconKey: 'upgrade', sortOrder: 2 },
      { title: 'Wi-Fi Setup/Installation', slug: 'wifi-setup-installation', iconKey: 'wifi', sortOrder: 3 },
      { title: 'Router/Modem Repair', slug: 'router-modem-repair', iconKey: 'build', sortOrder: 4 },
    ],
    complaintTypes: [
      { title: 'No Internet', slug: 'wifi-no-internet', sortOrder: 1 },
      { title: 'Low Speed', slug: 'low-speed', sortOrder: 2 },
      { title: 'Frequent Disconnections', slug: 'frequent-disconnections', sortOrder: 3 },
      { title: 'Wi-Fi Range Issues', slug: 'wifi-range-issues', sortOrder: 4 },
    ],
  },

  // 7. Annual Maintenance Contracts (AMC)
  {
    title: 'Annual Maintenance Contracts (AMC)',
    slug: 'amc-contracts',
    iconKey: 'amc',
    sortOrder: 7,
    subServices: [
      { title: 'Buy New AMC Plan', slug: 'buy-amc-plan', iconKey: 'shopping_bag', sortOrder: 1 },
      { title: 'AMC Renewal', slug: 'amc-renewal', iconKey: 'renewal', sortOrder: 2 },
      { title: 'Request Scheduled Maintenance', slug: 'request-scheduled-maintenance', iconKey: 'maintenance', sortOrder: 3 },
    ],
    complaintTypes: [
      { title: 'Scheduled Visit Delay', slug: 'scheduled-visit-delay', sortOrder: 1 },
      { title: 'Contract Coverage Inquiry', slug: 'contract-coverage-inquiry', sortOrder: 2 },
    ],
  },
];

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Checking and seeding database records idempotently...');

  // 1. SEED USERS
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const usersToSeed = [
    {
      name: 'Priya',
      email: 'priya@mafimushkil.com',
      phone: '+919876543210',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      avatarInitial: 'P',
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Arjun Rao',
      email: 'arjun@mafimushkil.com',
      phone: '+919811122233',
      passwordHash: defaultPasswordHash,
      role: UserRole.CUSTOMER,
      avatarInitial: 'A',
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Mafi Mushkil Admin',
      email: 'admin@mafimushkil.com',
      phone: '+919999900000',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      avatarInitial: 'M',
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Rahul Patil',
      email: 'rahul@mafimushkil.com',
      phone: '+919800011111',
      passwordHash: defaultPasswordHash,
      role: UserRole.ENGINEER,
      avatarInitial: 'R',
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Sneha Kulkarni',
      email: 'sneha@mafimushkil.com',
      phone: '+919800022222',
      passwordHash: defaultPasswordHash,
      role: UserRole.ENGINEER,
      avatarInitial: 'S',
      isActive: true,
      mustChangePassword: false,
    },
    {
      name: 'Amit Shah',
      email: 'amit@mafimushkil.com',
      phone: '+919800033333',
      passwordHash: defaultPasswordHash,
      role: UserRole.ENGINEER,
      avatarInitial: 'A',
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of usersToSeed) {
    const existing = await UserModel.findOne({ $or: [{ email: u.email }, { phone: u.phone }] });
    if (!existing) {
      await UserModel.create(u);
    }
  }

  // 2. IDEMPOTENT SEED CATALOG (Services, Sub-services, Complaint Types)
  console.log('[Seed] Upserting 7 Client Services, Sub-services, and Complaint Types...');

  for (const sDef of CLIENT_SERVICES_CONFIG) {
    let serviceDoc = await ServiceModel.findOne({
      $or: [{ slug: sDef.slug }, { title: sDef.title }],
    });

    const complaintIssues = sDef.complaintTypes.map((c) => c.title);

    if (!serviceDoc) {
      serviceDoc = await ServiceModel.create({
        title: sDef.title,
        slug: sDef.slug,
        iconKey: sDef.iconKey,
        sortOrder: sDef.sortOrder,
        complaintIssues,
        isActive: true,
      });
    } else {
      serviceDoc.title = sDef.title;
      serviceDoc.iconKey = sDef.iconKey;
      serviceDoc.sortOrder = sDef.sortOrder;
      serviceDoc.complaintIssues = complaintIssues;
      serviceDoc.isActive = true;
      await serviceDoc.save();
    }

    // Seed Sub-services (CategoryModel)
    for (const sub of sDef.subServices) {
      const existingCat = await CategoryModel.findOne({
        serviceId: serviceDoc._id,
        $or: [{ slug: sub.slug }, { title: sub.title }],
      });

      if (!existingCat) {
        await CategoryModel.create({
          serviceId: serviceDoc._id,
          title: sub.title,
          slug: sub.slug,
          iconKey: sub.iconKey,
          sortOrder: sub.sortOrder,
          isActive: true,
        });
      } else {
        existingCat.title = sub.title;
        existingCat.iconKey = sub.iconKey;
        existingCat.sortOrder = sub.sortOrder;
        existingCat.isActive = true;
        await existingCat.save();
      }
    }

    // Seed Complaint Types (ComplaintTypeModel)
    for (const ct of sDef.complaintTypes) {
      const existingCt = await ComplaintTypeModel.findOne({
        serviceId: serviceDoc._id,
        $or: [{ slug: ct.slug }, { title: ct.title }],
      });

      if (!existingCt) {
        await ComplaintTypeModel.create({
          serviceId: serviceDoc._id,
          title: ct.title,
          slug: ct.slug,
          sortOrder: ct.sortOrder,
          isActive: true,
        });
      } else {
        existingCt.title = ct.title;
        existingCt.sortOrder = ct.sortOrder;
        existingCt.isActive = true;
        await existingCt.save();
      }
    }
  }

  // 3. SEED PRODUCTS & SERVICE PACKAGES (if not present)
  const existingProducts = await ProductModel.countDocuments();
  if (existingProducts === 0) {
    const compService = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const cctvService = await ServiceModel.findOne({ slug: 'cctv-surveillance' });

    if (compService && cctvService) {
      const buyCompCat = await CategoryModel.findOne({ serviceId: compService._id, slug: 'buy-desktop-laptop' });
      const repairCompCat = await CategoryModel.findOne({ serviceId: compService._id, slug: 'hardware-repair' });
      const buyCctvCat = await CategoryModel.findOne({ serviceId: cctvService._id, slug: 'buy-cctv-system' });

      if (buyCompCat && repairCompCat && buyCctvCat) {
        await ProductModel.insertMany([
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
    }
  }

  // 4. SEED SERVICE REQUESTS (if none present)
  const existingRequests = await ServiceRequestModel.countDocuments();
  if (existingRequests === 0) {
    const priya = await UserModel.findOne({ phone: '+919876543210' });
    const arjun = await UserModel.findOne({ phone: '+919811122233' });
    const owner = await UserModel.findOne({ role: { $in: [UserRole.ADMIN, UserRole.OWNER] } });
    const rahul = await UserModel.findOne({ name: 'Rahul Patil' });
    const sneha = await UserModel.findOne({ name: 'Sneha Kulkarni' });
    const cctvService = await ServiceModel.findOne({ slug: 'cctv-surveillance' });
    const compService = await ServiceModel.findOne({ slug: 'computers-laptops' });
    const printService = await ServiceModel.findOne({ slug: 'printers-scanners' });
    const wifiService = await ServiceModel.findOne({ slug: 'wifi-services' });

    if (priya && arjun && owner && rahul && sneha && cctvService && compService && printService && wifiService) {
      await ServiceRequestModel.insertMany([
        {
          requestNumber: '#103',
          customerId: arjun._id,
          customerNameSnapshot: arjun.name,
          customerPhoneSnapshot: arjun.phone,
          serviceId: wifiService._id,
          snapshotTitle: 'Wi-Fi Services',
          problemDescription: 'Frequent disconnects and high ping during office hours',
          address: 'Powai, Mumbai',
          status: RequestStatus.OPEN,
          statusHistory: [
            {
              status: RequestStatus.OPEN,
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
          status: RequestStatus.OPEN,
          statusHistory: [
            {
              status: RequestStatus.OPEN,
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
          status: RequestStatus.ASSIGNED,
          assignedEngineerId: rahul._id,
          assignedEngineerNameSnapshot: rahul.name,
          assignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          statusHistory: [
            {
              status: RequestStatus.OPEN,
              changedBy: priya._id,
              changedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
              note: 'Created by customer',
            },
            {
              status: RequestStatus.ASSIGNED,
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
          status: RequestStatus.RESOLVED,
          assignedEngineerId: sneha._id,
          assignedEngineerNameSnapshot: sneha.name,
          assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          statusHistory: [
            {
              status: RequestStatus.OPEN,
              changedBy: priya._id,
              changedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            },
            {
              status: RequestStatus.ASSIGNED,
              changedBy: owner._id,
              changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            },
            {
              status: RequestStatus.RESOLVED,
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
          status: RequestStatus.RESOLVED,
          assignedEngineerId: rahul._id,
          assignedEngineerNameSnapshot: rahul.name,
          assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ]);
    }
  }

  // 5. SEED NOTIFICATIONS
  const existingNotifications = await NotificationModel.countDocuments();
  if (existingNotifications === 0) {
    const priya = await UserModel.findOne({ phone: '+919876543210' });
    if (priya) {
      await NotificationModel.insertMany([
        {
          recipientUserId: priya._id,
          title: 'Engineer Assigned',
          body: 'Rahul Patil is assigned to your Camera Install request.',
          type: NotificationType.ASSIGNMENT,
          isRead: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          recipientUserId: priya._id,
          title: 'Request Resolved',
          body: 'Your PC Repair request #099 is resolved. Please rate us!',
          type: NotificationType.RESOLUTION,
          isRead: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          recipientUserId: priya._id,
          title: 'Special Promotion',
          body: '20% OFF on your first camera installation.',
          type: NotificationType.PROMOTION,
          isRead: true,
          readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      ]);
    }
  }

  // 6. SEED PROMOTIONS
  const existingPromotions = await PromotionModel.countDocuments();
  if (existingPromotions === 0) {
    await PromotionModel.insertMany([
      {
        title: '20% OFF on your first camera installation',
        description: 'Get an exclusive 20% discount on professional CCTV camera setup & installation for your home or business.',
        discountPercentage: 20,
        serviceSlug: 'cctv-surveillance',
        isActive: true,
      },
      {
        title: 'Free Diagnostic with PC Repair',
        description: 'Complimentary hardware inspection and system health checkup with every PC diagnostic service.',
        discountPercentage: 100,
        serviceSlug: 'computers-laptops',
        isActive: true,
      },
    ]);
  }

  console.log('[Seed] Database initialization and idempotent seeding complete!');
}

if (process.argv[1]?.includes('seed')) {
  (async () => {
    try {
      const { connectDatabase, disconnectDatabase } = await import('../config/database');
      console.log('[Seed] Connecting to database for manual seeding...');
      await connectDatabase();
      await seedDatabase();
      await disconnectDatabase();
      console.log('[Seed] Standalone seeding completed successfully.');
      process.exit(0);
    } catch (err) {
      console.error('[Seed] Standalone seeding failed:', err);
      process.exit(1);
    }
  })();
}
