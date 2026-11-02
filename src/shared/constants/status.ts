export enum RequestStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  RESOLVED = 'RESOLVED',
}

export const ALL_REQUEST_STATUSES = [
  RequestStatus.OPEN,
  RequestStatus.ASSIGNED,
  RequestStatus.RESOLVED,
] as const;

export enum ComplaintStatus {
  OPEN = 'OPEN',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
}
