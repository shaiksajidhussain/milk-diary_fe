const now = new Date()

export const initialFarmers = [
  {
    id: 'FR-1001',
    name: 'Ramesh Patil',
    mobile: '+91 98765 43210',
    village: 'Khedgaon',
    status: 'active',
    qrPayload: 'dairy:farmer:FR-1001',
  },
  {
    id: 'FR-1002',
    name: 'Sunita Kulkarni',
    mobile: '+91 91234 56789',
    village: 'Malkapur',
    status: 'active',
    qrPayload: 'dairy:farmer:FR-1002',
  },
  {
    id: 'FR-1003',
    name: 'Vikram Jadhav',
    mobile: '+91 99887 76655',
    village: 'Shirur',
    status: 'active',
    qrPayload: 'dairy:farmer:FR-1003',
  },
  {
    id: 'FR-1004',
    name: 'Meena Deshmukh',
    mobile: '+91 90909 80808',
    village: 'Khedgaon',
    status: 'inactive',
    qrPayload: 'dairy:farmer:FR-1004',
  },
  {
    id: 'FR-1005',
    name: 'Anil Shinde',
    mobile: '+91 98123 45678',
    village: 'Niphad',
    status: 'active',
    qrPayload: 'dairy:farmer:FR-1005',
  },
  {
    id: 'FR-1006',
    name: 'Kavita More',
    mobile: '+91 97654 32109',
    village: 'Malkapur',
    status: 'active',
    qrPayload: 'dairy:farmer:FR-1006',
  },
]

function daysAgo(n) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  d.setHours(7 + (n % 5), 10 + (n % 40), 0, 0)
  return d
}

export const initialCollections = [
  {
    id: 'col-001',
    farmerId: 'FR-1001',
    farmerName: 'Ramesh Patil',
    weight: 12.4,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(0).toISOString(),
  },
  {
    id: 'col-002',
    farmerId: 'FR-1002',
    farmerName: 'Sunita Kulkarni',
    weight: 8.75,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(0).toISOString(),
  },
  {
    id: 'col-003',
    farmerId: 'FR-1003',
    farmerName: 'Vikram Jadhav',
    weight: 15.2,
    session: 'Evening',
    status: 'Completed',
    createdAt: daysAgo(1).toISOString(),
  },
  {
    id: 'col-004',
    farmerId: 'FR-1005',
    farmerName: 'Anil Shinde',
    weight: 10.1,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(1).toISOString(),
  },
  {
    id: 'col-005',
    farmerId: 'FR-1006',
    farmerName: 'Kavita More',
    weight: 9.35,
    session: 'Evening',
    status: 'Completed',
    createdAt: daysAgo(2).toISOString(),
  },
  {
    id: 'col-006',
    farmerId: 'FR-1001',
    farmerName: 'Ramesh Patil',
    weight: 11.9,
    session: 'Evening',
    status: 'Completed',
    createdAt: daysAgo(2).toISOString(),
  },
  {
    id: 'col-007',
    farmerId: 'FR-1002',
    farmerName: 'Sunita Kulkarni',
    weight: 8.2,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(3).toISOString(),
  },
  {
    id: 'col-008',
    farmerId: 'FR-1003',
    farmerName: 'Vikram Jadhav',
    weight: 14.6,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(4).toISOString(),
  },
  {
    id: 'col-009',
    farmerId: 'FR-1005',
    farmerName: 'Anil Shinde',
    weight: 10.8,
    session: 'Evening',
    status: 'Completed',
    createdAt: daysAgo(5).toISOString(),
  },
  {
    id: 'col-010',
    farmerId: 'FR-1006',
    farmerName: 'Kavita More',
    weight: 9.0,
    session: 'Morning',
    status: 'Completed',
    createdAt: daysAgo(6).toISOString(),
  },
]

export const dairyCenterDefaults = {
  name: 'Shree Krishna Dairy Cooperative',
  code: 'SKD-01',
  address: 'Main Road, Khedgaon, Maharashtra',
  contact: '+91 2552 123456',
}
