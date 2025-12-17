/**
 * Demo Data
 * Sample data for testing offline functionality
 */

export const demoSchedules = [
  {
    id: 1,
    date: '2024-01-15',
    job_title: 'Residential Renovation',
    location: '123 Main St, Springfield',
    start_time: '08:00',
    end_time: '16:00',
    status: 'scheduled',
    crew_size: 4,
    equipment: ['Excavator', 'Concrete mixer']
  },
  {
    id: 2,
    date: '2024-01-16',
    job_title: 'Commercial Building - Floor 3',
    location: '456 Business Ave, Downtown',
    start_time: '07:00',
    end_time: '15:00',
    status: 'scheduled',
    crew_size: 6,
    equipment: ['Scaffolding', 'Power tools']
  },
  {
    id: 3,
    date: '2024-01-17',
    job_title: 'Landscape Installation',
    location: '789 Park Rd, Suburbs',
    start_time: '08:30',
    end_time: '17:00',
    status: 'scheduled',
    crew_size: 3,
    equipment: ['Bobcat', 'Hand tools']
  }
];

export const demoJobCards = [
  {
    id: 1,
    job_number: 'JOB-2024-001',
    client: 'ABC Construction Co.',
    title: 'Foundation Repair',
    status: 'active',
    priority: 'high',
    assigned_to: 'John Smith',
    progress: 65,
    tasks: [
      { id: 1, name: 'Site assessment', completed: true },
      { id: 2, name: 'Material delivery', completed: true },
      { id: 3, name: 'Foundation excavation', completed: false },
      { id: 4, name: 'Concrete pouring', completed: false }
    ],
    notes: 'Weather dependent - check forecast',
    start_date: '2024-01-10',
    estimated_completion: '2024-01-25'
  },
  {
    id: 2,
    job_number: 'JOB-2024-002',
    client: 'XYZ Properties Ltd.',
    title: 'Roof Replacement',
    status: 'active',
    priority: 'medium',
    assigned_to: 'Jane Doe',
    progress: 30,
    tasks: [
      { id: 1, name: 'Remove old roofing', completed: true },
      { id: 2, name: 'Inspect structure', completed: false },
      { id: 3, name: 'Install new shingles', completed: false },
      { id: 4, name: 'Final inspection', completed: false }
    ],
    notes: 'Client wants premium shingles',
    start_date: '2024-01-12',
    estimated_completion: '2024-01-30'
  },
  {
    id: 3,
    job_number: 'JOB-2024-003',
    client: 'Green Spaces Inc.',
    title: 'Park Restoration',
    status: 'pending',
    priority: 'low',
    assigned_to: 'Mike Johnson',
    progress: 10,
    tasks: [
      { id: 1, name: 'Survey area', completed: true },
      { id: 2, name: 'Remove dead vegetation', completed: false },
      { id: 3, name: 'Plant new trees', completed: false },
      { id: 4, name: 'Install irrigation', completed: false }
    ],
    notes: 'Spring planting preferred',
    start_date: '2024-01-20',
    estimated_completion: '2024-02-15'
  }
];

export const demoEarnings = [
  {
    id: 1,
    amount: 4250.00,
    period: '2024-01',
    description: 'January 2024 - Regular hours',
    hours: 160,
    overtime_hours: 12,
    rate: 25.00,
    overtime_rate: 37.50,
    breakdown: {
      regular: 4000.00,
      overtime: 450.00,
      bonus: 0.00,
      deductions: -200.00
    }
  },
  {
    id: 2,
    amount: 3890.00,
    period: '2023-12',
    description: 'December 2023 - Holiday bonus included',
    hours: 152,
    overtime_hours: 8,
    rate: 25.00,
    overtime_rate: 37.50,
    breakdown: {
      regular: 3800.00,
      overtime: 300.00,
      bonus: 500.00,
      deductions: -710.00
    }
  },
  {
    id: 3,
    amount: 4100.00,
    period: '2023-11',
    description: 'November 2023 - Standard pay',
    hours: 160,
    overtime_hours: 4,
    rate: 25.00,
    overtime_rate: 37.50,
    breakdown: {
      regular: 4000.00,
      overtime: 150.00,
      bonus: 0.00,
      deductions: -50.00
    }
  }
];

export const demoAudits = [
  {
    id: 1,
    title: 'Safety Inspection - Site A',
    notes: 'All safety equipment in place. Minor issue with scaffolding stability.',
    photos: [],
    status: 'synced',
    created_at: Date.now() - 86400000, // 1 day ago
    synced_at: Date.now() - 86300000,
    server_id: 101
  },
  {
    id: 2,
    title: 'Quality Check - Foundation',
    notes: 'Concrete quality verified. No cracks observed.',
    photos: [],
    status: 'synced',
    created_at: Date.now() - 172800000, // 2 days ago
    synced_at: Date.now() - 172700000,
    server_id: 102
  }
];

/**
 * Helper function to load demo data into the database
 */
export async function loadDemoData(offlineSync) {
  try {
    console.log('[DemoData] Loading demo data into database...');
    
    // Cache schedules
    await offlineSync.cacheSchedules(demoSchedules);
    
    // Cache job cards
    await offlineSync.cacheJobCards(demoJobCards);
    
    // Cache earnings
    await offlineSync.cacheEarnings(demoEarnings);
    
    // Create demo audits
    for (const audit of demoAudits) {
      await offlineSync.createAudit({
        title: audit.title,
        notes: audit.notes,
        photos: audit.photos
      });
    }
    
    console.log('[DemoData] Demo data loaded successfully');
    return true;
  } catch (error) {
    console.error('[DemoData] Error loading demo data:', error);
    return false;
  }
}

/**
 * Generate sample audit data
 */
export function generateSampleAudit() {
  const titles = [
    'Daily Site Inspection',
    'Equipment Check',
    'Safety Audit',
    'Quality Control',
    'Progress Review'
  ];
  
  const notes = [
    'All equipment operational',
    'Minor issues identified and addressed',
    'No safety concerns noted',
    'Work progressing as scheduled',
    'Weather conditions favorable'
  ];
  
  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    notes: notes[Math.floor(Math.random() * notes.length)],
    photos: []
  };
}

export default {
  demoSchedules,
  demoJobCards,
  demoEarnings,
  demoAudits,
  loadDemoData,
  generateSampleAudit
};
