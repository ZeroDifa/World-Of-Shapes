module.exports = {
    TOKEN_SECRET: "6461157b032e2bcef2b3777b",
    basic_characteristics: {
        // НЕ ДОБАВЛЯТЬ ОБЪЕКТЫ, ЛИБО ЖЕ ПЕРЕСМОТРЕСМОТРЕТЬ ФАЙЛ controllers/user.js
        1: {
            description: 'Класс маг. Слабая живучесть, компенсируемая хорошей мобильностью и малыми габаритами. Имеет уникальную механику "концентрация", позволяющая подготавливать мощные атаки. ',

            AllowSpells: ['global', 1, 2, 3, 6],
            stamina: 45,
			protection: 0.9,
            speed: 6,
            radius: 30,
            damageRate: 1,

			intelligence: 30,
			manaRegenAtRest: 5,
			manaRegenAtCombat: 1,
            spellDamagePower: 30,

            maxEnergy: 0,
            energyRegen: 0,
            rotationEasing: 0,

            level: 1,
            xp: 0,

            kills: 0
        },
        2: {
            description: 'Класс охотник. Хорошая защита, неплохой урон. Плохая подвижность, но большой запас жизни.',


            AllowSpells: ['global', 4, 5, 6, 7],
            stamina: 55,
			protection: 0.6,
            speed: 4,
            radius: 50,
            damageRate: 1,

			intelligence: 0,
			manaRegenAtRest: 0,
			manaRegenAtCombat: 0,
            spellDamagePower: 0,

            maxEnergy: 100,
            energyRegen: 16,
            rotationEasing: 0.1,

            level: 1,
            xp: 0,

            kills: 0
        }
    },
    RequiredExperienceFactor: 1.25,
    BaseExperience: 300,
    ExperienceForKillFactor: 0.25,
    BaseExperienceForKill: 150,
};