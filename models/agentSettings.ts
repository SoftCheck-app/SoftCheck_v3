import { Prisma } from '@prisma/client';

// AgentSettings model definition
const agentSettingsExtension = Prisma.defineExtension((prisma) => {
  return prisma.$extends({
    model: {
      agentSettings: {
        /**
         * Find agent settings by team ID
         */
        async findByTeamId(teamId: string) {
          const settings = await prisma.agentSettings.findUnique({
            where: {
              teamId,
            },
          });
          
          return settings;
        },

        /**
         * Create or update agent settings for a team
         */
        async upsert({
          teamId,
          isActive,
          isActiveMode,
          autoUpdate,
        }: {
          teamId: string;
          isActive?: boolean;
          isActiveMode?: boolean;
          autoUpdate?: boolean;
        }) {
          const existingSettings = await prisma.agentSettings.findUnique({
            where: {
              teamId,
            },
          });

          if (existingSettings) {
            // Update existing settings
            return prisma.agentSettings.update({
              where: {
                id: existingSettings.id,
              },
              data: {
                isActive: isActive !== undefined ? isActive : existingSettings.isActive,
                isActiveMode: isActiveMode !== undefined ? isActiveMode : existingSettings.isActiveMode,
                autoUpdate: autoUpdate !== undefined ? autoUpdate : existingSettings.autoUpdate,
              },
            });
          } else {
            // Create new settings with defaults
            return prisma.agentSettings.create({
              data: {
                teamId,
                isActive: isActive !== undefined ? isActive : true,
                isActiveMode: isActiveMode !== undefined ? isActiveMode : true,
                autoUpdate: autoUpdate !== undefined ? autoUpdate : true,
              },
            });
          }
        },
      },
    },
  });
});

export default agentSettingsExtension; 