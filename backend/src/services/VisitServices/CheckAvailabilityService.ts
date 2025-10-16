import Visit from "../../models/Visit";
import { Op } from "sequelize";

interface Request {
  propertyId: number;
  date: Date;
}

interface TimeSlot {
  time: string;
  available: boolean;
  visitId?: number;
}

const CheckAvailabilityService = async ({ propertyId, date }: Request): Promise<TimeSlot[]> => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const visits = await Visit.findAll({
    where: {
      propertyId,
      scheduledDate: {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      },
      status: {
        [Op.in]: ["scheduled", "in_progress"]
      }
    }
  });

  const businessHours = [
    "09:00", "10:00", "11:00", "12:00",
    "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const availability: TimeSlot[] = businessHours.map(time => {
    const [hours, minutes] = time.split(":").map(Number);
    const slotDate = new Date(targetDate);
    slotDate.setHours(hours, minutes, 0, 0);

    const conflictingVisit = visits.find(visit => {
      const visitDate = new Date(visit.scheduledDate);
      return Math.abs(visitDate.getTime() - slotDate.getTime()) < 60 * 60 * 1000;
    });

    return {
      time,
      available: !conflictingVisit,
      visitId: conflictingVisit?.id
    };
  });

  return availability;
};

export default CheckAvailabilityService;
