import { prisma } from "./prisma";

export async function checkAndUpdateMilestones(userId: string) {
  try {
    // 1. Get total logs count
    const totalLogs = await prisma.trackerLog.count({ where: { userId } });

    // 2. Get unachieved milestones for this user
    const pendingMilestones = await prisma.milestone.findMany({
      where: { userId, isAchieved: false },
    });

    for (const milestone of pendingMilestones) {
      let isUnlocked = false;
      let newCurrentValue = milestone.currentValue;

      if (milestone.category === "TOTAL_VOLUME") {
        newCurrentValue = totalLogs;
        if (newCurrentValue >= milestone.targetValue) {
          isUnlocked = true;
        }
      } else if (milestone.trackerId) {
        // Tracker-specific milestone
        // Find best or latest value
        const logs = await prisma.trackerLog.findMany({
          where: { userId, trackerId: milestone.trackerId },
          orderBy: { date: "desc" },
        });

        if (logs.length > 0) {
          const maxVal = Math.max(...logs.map((l) => l.value));
          newCurrentValue = maxVal;
          if (maxVal >= milestone.targetValue) {
            isUnlocked = true;
          }
        }
      }

      await prisma.milestone.update({
        where: { id: milestone.id },
        data: {
          currentValue: newCurrentValue,
          isAchieved: isUnlocked,
          achievedAt: isUnlocked ? new Date() : null,
        },
      });
    }
  } catch (error) {
    console.error("Error checking milestones:", error);
  }
}

export async function seedDefaultMilestones(userId: string) {
  const defaultMilestones = [
    {
      userId,
      title: "First Step",
      description: "Log your first fitness entry in FittR",
      targetValue: 1,
      category: "TOTAL_VOLUME",
      icon: "Footprints",
    },
    {
      userId,
      title: "Consistent Kickoff",
      description: "Log 7 entries across your trackers",
      targetValue: 7,
      category: "TOTAL_VOLUME",
      icon: "Flame",
    },
    {
      userId,
      title: "Monthly Habit",
      description: "Log 30 entries across your trackers",
      targetValue: 30,
      category: "TOTAL_VOLUME",
      icon: "Zap",
    },
    {
      userId,
      title: "Century Club",
      description: "Reach 100 total logged fitness activities",
      targetValue: 100,
      category: "TOTAL_VOLUME",
      icon: "Trophy",
    },
  ];

  for (const m of defaultMilestones) {
    await prisma.milestone.create({ data: m });
  }
}

