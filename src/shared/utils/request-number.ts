import { ServiceRequestModel } from '../../modules/requests/request.model';

export async function generateNextRequestNumber(): Promise<string> {
  const latest = await ServiceRequestModel.findOne({}, { requestNumber: 1 })
    .sort({ createdAt: -1 })
    .lean();

  if (!latest || !latest.requestNumber) {
    return '#101';
  }

  const match = latest.requestNumber.replace('#', '').trim();
  const num = parseInt(match, 10);
  if (isNaN(num)) {
    return `#${Date.now().toString().slice(-4)}`;
  }

  const next = num + 1;
  return `#${next.toString().padStart(3, '0')}`;
}
