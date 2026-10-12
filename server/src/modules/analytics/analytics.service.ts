import { prisma } from '../../lib/prisma.js';

type UserRole =
  | 'ADMIN'
  | 'PROJECT_MANAGER'
  | 'DEVELOPER'
  | 'DESIGNER'
  | 'QA';

export async function getDashboardAnalytics(
  userId: string,
  userRole: UserRole,
  query?: {
    projectId?: string;
    status?: string;
    priority?: string;
  },
) {
  const now = new Date();
  const projectIdFilter = query?.projectId
    ? query.projectId
    : undefined;

  if (userRole === 'ADMIN') {
    const [
      totalUsers,
      usersByRole,
      totalProjects,
      projectsByStatus,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      teamWorkload,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      prisma.project.count({
        where: projectIdFilter
          ? { id: projectIdFilter }
          : {},
      }),
      prisma.project.groupBy({
        by: ['status'],
        where: projectIdFilter
          ? { id: projectIdFilter }
          : {},
        _count: { id: true },
      }),
      prisma.task.count({
        where: projectIdFilter
          ? { projectId: projectIdFilter }
          : {},
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: projectIdFilter
          ? { projectId: projectIdFilter }
          : {},
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: projectIdFilter
          ? { projectId: projectIdFilter }
          : {},
        _count: { id: true },
      }),
      prisma.task.findMany({
        where: {
          ...(projectIdFilter
            ? { projectId: projectIdFilter }
            : {}),
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          role: {
            in: [
              'DEVELOPER',
              'DESIGNER',
              'QA',
            ],
          },
        },
        select: {
          id: true,
          name: true,
          role: true,
          _count: {
            select: {
              assignedTasks: {
                where: {
                  status: { not: 'DONE' },
                },
              },
            },
          },
        },
      }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      role: 'ADMIN',
      stats: {
        totalUsers,
        usersByRole,
        totalProjects,
        projectsByStatus,
        totalTasks,
        tasksByStatus,
        tasksByPriority,
      },
      overdueTasks,
      teamWorkload,
      recentActivity,
    };
  }

  if (userRole === 'PROJECT_MANAGER') {
    const ownedProjects =
      await prisma.project.findMany({
        where: {
          ownerId: userId,
          ...(projectIdFilter
            ? { id: projectIdFilter }
            : {}),
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      });

    const projectIds = ownedProjects.map(
      (p) => p.id,
    );

    const [
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      upcomingDeadlines,
      teamWorkload,
      recentActivity,
    ] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: {
          projectId: { in: projectIds },
        },
        _count: { id: true },
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: {
          projectId: { in: projectIds },
        },
        _count: { id: true },
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { lt: now },
          status: { not: 'DONE' },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          dueDate: { gte: now },
          status: { not: 'DONE' },
        },
        include: {
          project: {
            select: { id: true, name: true },
          },
          assignees: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      prisma.user.findMany({
        where: {
          projectMemberships: {
            some: {
              projectId: { in: projectIds },
            },
          },
        },
        select: {
          id: true,
          name: true,
          role: true,
          assignedTasks: {
            where: {
              projectId: { in: projectIds },
              status: { not: 'DONE' },
            },
            select: { id: true },
          },
        },
      }),
      prisma.activityLog.findMany({
        where: {
          projectId: { in: projectIds },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          project: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      role: 'PROJECT_MANAGER',
      ownedProjects,
      stats: {
        totalProjects: ownedProjects.length,
        tasksByStatus,
        tasksByPriority,
      },
      overdueTasks,
      upcomingDeadlines,
      teamWorkload: teamWorkload.map((u) => ({
        ...u,
        activeTasksCount:
          u.assignedTasks.length,
      })),
      recentActivity,
    };
  }

  // DEVELOPER, DESIGNER, QA
  const [
    assignedTasks,
    tasksByStatus,
    overdueTasks,
    upcomingDeadlines,
    recentActivity,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          {
            assignees: {
              some: { userId },
            },
          },
        ],
        ...(projectIdFilter
          ? { projectId: projectIdFilter }
          : {}),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        OR: [
          { assigneeId: userId },
          {
            assignees: {
              some: { userId },
            },
          },
        ],
        ...(projectIdFilter
          ? { projectId: projectIdFilter }
          : {}),
      },
      _count: { id: true },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          {
            assignees: {
              some: { userId },
            },
          },
        ],
        dueDate: { lt: now },
        status: { not: 'DONE' },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: userId },
          {
            assignees: {
              some: { userId },
            },
          },
        ],
        dueDate: { gte: now },
        status: { not: 'DONE' },
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    }),
    prisma.activityLog.findMany({
      where: {
        OR: [
          { actorId: userId },
          {
            task: {
              OR: [
                { assigneeId: userId },
                {
                  assignees: {
                    some: { userId },
                  },
                },
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  return {
    role: userRole,
    assignedTasks,
    stats: {
      totalAssigned: assignedTasks.length,
      tasksByStatus,
    },
    overdueTasks,
    upcomingDeadlines,
    recentActivity,
  };
}
