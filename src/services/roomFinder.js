const db = require('../database/db');
const { intervalsOverlap } = require('./clashDetector');

const roomFinder = {
    /**
     * Find all classrooms free during the requested day and time interval.
     */
    async findAvailableRooms({ day_of_week, start_time, end_time, min_capacity = 0, room_type = null, require_projector = false }) {
        if (!day_of_week || !start_time || !end_time) {
            throw new Error('day_of_week, start_time, and end_time are required to query room availability.');
        }

        const [allRooms, sessionsOnDay] = await Promise.all([
            db.getRooms(),
            db.getSessions({ day_of_week })
        ]);

        const activeSessions = sessionsOnDay.filter(s => s.status !== 'CANCELLED');

        // Identify occupied room IDs during this window
        const occupiedRoomIds = new Set();
        for (const session of activeSessions) {
            if (intervalsOverlap(start_time, end_time, session.start_time, session.end_time)) {
                occupiedRoomIds.add(session.room_id);
            }
        }

        // Filter and annotate rooms
        const results = allRooms.map(room => {
            const isBooked = occupiedRoomIds.has(room.id);
            const meetsCapacity = min_capacity > 0 ? room.capacity >= min_capacity : true;
            const meetsType = room_type ? room.room_type === room_type : true;
            const meetsProjector = require_projector ? room.has_projector : true;

            const isAvailable = !isBooked && room.is_active;

            return {
                ...room,
                is_available: isAvailable,
                meets_capacity: meetsCapacity,
                meets_type: meetsType,
                meets_projector: meetsProjector,
                suitability: isAvailable && meetsCapacity ? 'OPTIMAL' : isAvailable ? 'CAPACITY_WARN' : 'OCCUPIED'
            };
        });

        // Filter to available rooms
        const availableRooms = results.filter(r => r.is_available);

        // Sort: Optimal capacity first, then by capacity ascending (closest fit)
        availableRooms.sort((a, b) => {
            if (a.suitability === 'OPTIMAL' && b.suitability !== 'OPTIMAL') return -1;
            if (a.suitability !== 'OPTIMAL' && b.suitability === 'OPTIMAL') return 1;
            return a.capacity - b.capacity;
        });

        return {
            day_of_week,
            start_time,
            end_time,
            totalRooms: allRooms.length,
            availableCount: availableRooms.length,
            occupiedCount: occupiedRoomIds.size,
            availableRooms,
            allRoomStatuses: results
        };
    }
};

module.exports = roomFinder;
