import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

// --- CONSTANTS ---
const XP_PER_ACTION = 25;
const XP_TO_LEVEL_UP = 100;

// --- DATA STRUCTURES ---
type MaintenanceAction = {
  action: string;
  date: string;
};

type Equipment = {
  id: string;
  name: string;
  level: number;
  xp: number;
  maintenanceHistory: MaintenanceAction[];
};

type HealthStatus = 'Healthy' | 'Normal' | 'Sick' | 'Neglected';

type EquipmentWithStatus = Omit<Equipment, 'maintenanceHistory'> & {
  healthStatus: HealthStatus;
  lastMaintenance: MaintenanceAction | null;
};

// --- FILE PATH ---
const jsonDirectory = path.join(process.cwd(), 'src', 'data');
const filePath = path.join(jsonDirectory, 'equipment.json');

// --- HELPER FUNCTIONS ---

async function getEquipmentData(): Promise<Equipment[]> {
  const fileContents = await fs.readFile(filePath, 'utf8');
  return JSON.parse(fileContents);
}

const getMostRecentMaintenance = (history: MaintenanceAction[]): MaintenanceAction | null => {
  if (!history || history.length === 0) return null;
  return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

const getHealthStatus = (lastAction: MaintenanceAction | null): HealthStatus => {
  if (!lastAction) return 'Neglected'; // No history is also neglected
  const now = new Date('2025-09-09T12:00:00Z');
  const maintenanceDate = new Date(lastAction.date);
  const diffInMs = now.getTime() - maintenanceDate.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

  if (diffInDays <= 7) return 'Healthy';
  if (diffInDays <= 14) return 'Normal';
  if (diffInDays <= 30) return 'Sick';
  return 'Neglected'; // More than 30 days is neglected
};

// --- API HANDLERS ---

// GET /api/equipment
export async function GET() {
  try {
    const equipmentData = await getEquipmentData();

    const equipmentWithStatus: EquipmentWithStatus[] = equipmentData.map((item) => {
      const lastMaintenance = getMostRecentMaintenance(item.maintenanceHistory);
      return {
        id: item.id,
        name: item.name,
        level: item.level,
        xp: item.xp,
        healthStatus: getHealthStatus(lastMaintenance),
        lastMaintenance: lastMaintenance,
      };
    });

    return NextResponse.json(equipmentWithStatus);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ message: 'Error reading equipment data' }, { status: 500 });
  }
}

// POST /api/equipment
export async function POST(request: Request) {
  try {
    const { equipmentId, action } = await request.json();
    if (!equipmentId || !action) {
      return NextResponse.json({ message: 'Missing equipmentId or action' }, { status: 400 });
    }

    const equipmentData = await getEquipmentData();
    const equipmentIndex = equipmentData.findIndex(e => e.id === equipmentId);
    if (equipmentIndex === -1) {
      return NextResponse.json({ message: 'Equipment not found' }, { status: 404 });
    }

    const equipment = equipmentData[equipmentIndex];

    // Add new maintenance action
    const newAction: MaintenanceAction = { action, date: new Date().toISOString() };
    equipment.maintenanceHistory.push(newAction);

    // Add XP and check for level up
    equipment.xp += XP_PER_ACTION;
    let leveledUp = false;
    if (equipment.xp >= XP_TO_LEVEL_UP) {
      equipment.level += 1;
      equipment.xp %= XP_TO_LEVEL_UP; // Reset XP but keep the remainder
      leveledUp = true;
    }

    await fs.writeFile(filePath, JSON.stringify(equipmentData, null, 2), 'utf8');

    return NextResponse.json({
      message: 'Maintenance recorded successfully',
      action: newAction,
      leveledUp,
      newLevel: equipment.level,
      newXp: equipment.xp,
    });

  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ message: 'Error writing equipment data' }, { status: 500 });
  }
}