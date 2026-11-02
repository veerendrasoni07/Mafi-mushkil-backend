import { UserModel } from '../modules/users/user.model';
import { ServiceModel, CategoryModel, ProductModel } from '../modules/catalog/catalog.models';
import { ServiceRequestModel } from '../modules/requests/request.model';
import { NotificationModel, NotificationType } from '../modules/notifications/notification.model';
import { PromotionModel } from '../modules/promotions/promotion.model';
import { UserRole } from '../shared/constants/roles';
import { RequestStatus } from '../shared/constants/status';

export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Checking and seeding database records from PDF design...');

  // 1. SEED USERS
  const existingUsers = await UserModel.countDocuments();
  if (existingUsers === 0) {
    console.log('[Seed] Seeding Users...');
    const users = await UserModel.insertMany([
      {
        name: 'Priya',
        phone: '+919876543210',
        role: UserRole.CUSTOMER,
        avatarInitial: 'P',
        isActive: true,
      },
      {
        name: 'Arjun Rao',
        phone: '+919811122233',
        role: UserRole.CUSTOMER,
        avatarInitial: 'A',
        isActive: true,
      },
      {
        name: 'Mafi Mushkil Owner',
        phone: '+919999900000',
        role: UserRole.OWNER,
        avatarInitial: 'M',
        isActive: true,
      },
      {
        name: 'Rahul Patil',
        phone: '+919800011111',
        role: UserRole.ENGINEER,
        avatarInitial: 'R',
        isActive: true,
      },
      {
        name: 'Sneha Kulkarni',
        phone: '+919800022222',
        role: UserRole.ENGINEER,
        avatarInitial: 'S',
        isActive: true,
      },
      {
        name: 'Amit Shah',
        phone: '+919800033333',
        role: UserRole.ENGINEER,
        avatarInitial: 'A',
        isActive: true,
      },
    ]);
    console.log(`[Seed] Seeded ${users.length} users.`);
  }

  // 2. SEED CATALOG (Services, Categories, Products)
  const existingServices = await ServiceModel.countDocuments();
  if (existingServices === 0) {
    console.log('[Seed] Seeding Services...');
    const services = await ServiceModel.insertMany([
      { title: 'Camera Install', slug: 'camera-install', iconKey: 'camera', sortOrder: 1 },
      { title: 'PC Repair', slug: 'pc-repair', iconKey: 'monitor', sortOrder: 2 },
      { title: 'Keyboard', slug: 'keyboard', iconKey: 'keyboard', sortOrder: 3 },
      { title: 'Mouse', slug: 'mouse', iconKey: 'mouse', sortOrder: 4 },
      { title: 'CPU', slug: 'cpu', iconKey: 'cpu', sortOrder: 5 },
      { title: 'Networking', slug: 'networking', iconKey: 'wifi', sortOrder: 6 },
      { title: 'Printer', slug: 'printer', iconKey: 'printer', sortOrder: 7 },
      { title: 'Data Backup', slug: 'data-backup', iconKey: 'storage', sortOrder: 8 },
      { title: 'More', slug: 'more', iconKey: 'more', sortOrder: 9 },
    ]);

    const cameraService = services.find((s) => s.slug === 'camera-install')!;

    console.log('[Seed] Seeding Camera Categories...');
    const categories = await CategoryModel.insertMany([
      { serviceId: cameraService._id, title: 'Dome', slug: 'dome', iconKey: 'dome', sortOrder: 1 },
      { serviceId: cameraService._id, title: 'Bullet', slug: 'bullet', iconKey: 'bullet', sortOrder: 2 },
      { serviceId: cameraService._id, title: 'PTZ', slug: 'ptz', iconKey: 'ptz', sortOrder: 3 },
      { serviceId: cameraService._id, title: 'Wi-Fi / IP', slug: 'wifi-ip', iconKey: 'wifi', sortOrder: 4 },
      { serviceId: cameraService._id, title: 'DVR / NVR', slug: 'dvr-nvr', iconKey: 'dvr', sortOrder: 5 },
      { serviceId: cameraService._id, title: 'Accessories', slug: 'accessories', iconKey: 'plug', sortOrder: 6 },
    ]);

    const domeCategory = categories.find((c) => c.slug === 'dome')!;

    console.log('[Seed] Seeding Dome Camera Products...');
    await ProductModel.insertMany([
      {
        serviceId: cameraService._id,
        categoryId: domeCategory._id,
        title: 'Dome 2MP Indoor',
        description: 'High-definition 1080p indoor dome security camera with infrared night vision.',
        priceMinorUnits: 149900,
        currency: 'INR',
        imageKey: 'dome_2mp',
        sortOrder: 1,
      },
      {
        serviceId: cameraService._id,
        categoryId: domeCategory._id,
        title: 'Dome 5MP Night Vision',
        description: 'Ultra-clear 5MP resolution with advanced color night vision and weatherproofing.',
        priceMinorUnits: 249900,
        currency: 'INR',
        imageKey: 'dome_5mp',
        sortOrder: 2,
      },
      {
        serviceId: cameraService._id,
        categoryId: domeCategory._id,
        title: 'Dome Audio Camera',
        description: 'Dome camera with integrated two-way audio microphone and noise cancellation.',
        priceMinorUnits: 299900,
        currency: 'INR',
        imageKey: 'dome_audio',
        sortOrder: 3,
      },
    ]);
  }

  // 3. SEED REQUESTS (matching PDF screens 3, 4, 6)
  const existingRequests = await ServiceRequestModel.countDocuments();
  if (existingRequests === 0) {
    console.log('[Seed] Seeding Service Requests...');
    const priya = await UserModel.findOne({ phone: '+919876543210' });
    const arjun = await UserModel.findOne({ phone: '+919811122233' });
    const owner = await UserModel.findOne({ role: UserRole.OWNER });
    const rahul = await UserModel.findOne({ name: 'Rahul Patil' });
    const sneha = await UserModel.findOne({ name: 'Sneha Kulkarni' });
    const cameraService = await ServiceModel.findOne({ slug: 'camera-install' });
    const keyboardService = await ServiceModel.findOne({ slug: 'keyboard' });
    const mouseService = await ServiceModel.findOne({ slug: 'mouse' });
    const pcRepairService = await ServiceModel.findOne({ slug: 'pc-repair' });

    if (priya && arjun && owner && rahul && sneha && cameraService && keyboardService && mouseService && pcRepairService) {
      await ServiceRequestModel.insertMany([
        {
          requestNumber: '#103',
          customerId: arjun._id,
          customerNameSnapshot: arjun.name,
          customerPhoneSnapshot: arjun.phone,
          serviceId: mouseService._id,
          snapshotTitle: 'Mouse double-clicking',
          problemDescription: 'Mouse not responding well and double clicking on single tap',
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
          serviceId: keyboardService._id,
          snapshotTitle: 'Keyboard',
          problemDescription: 'Several keys not working properly on mechanical board',
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
          serviceId: cameraService._id,
          snapshotTitle: 'Camera Install',
          problemDescription: '4 CCTV cameras for shop',
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
          serviceId: pcRepairService._id,
          snapshotTitle: 'PC Repair',
          problemDescription: 'PC not booting, power LED blinks blue then turns off',
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
          serviceId: cameraService._id,
          snapshotTitle: 'Camera Install',
          problemDescription: 'Wi-Fi camera offline',
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

  // 4. SEED NOTIFICATIONS (matching PDF screen 12)
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
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // Today
        },
        {
          recipientUserId: priya._id,
          title: 'Request Resolved',
          body: 'Your PC Repair request #099 is resolved. Please rate us!',
          type: NotificationType.RESOLUTION,
          isRead: false,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Today
        },
        {
          recipientUserId: priya._id,
          title: 'Special Promotion',
          body: '20% OFF on your first camera installation.',
          type: NotificationType.PROMOTION,
          isRead: true,
          readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      ]);
    }
  }

  // 5. SEED PROMOTIONS
  const existingPromotions = await PromotionModel.countDocuments();
  if (existingPromotions === 0) {
    await PromotionModel.insertMany([
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
