// Green Building Tycoon - Core Game JavaScript
let money = 0;
let moneyPerClick = 1;
let passiveIncomeFromUpgrades = 0; 
let buildingLevel = 1;
let waste = 0; 
let maxWaste = 100; 
let maxWater = 100;
let water = maxWater; 
let maxEnergy = 100;
let energy = maxEnergy; 
let carbon = 0;
let maxFood = 50;
let food = 25; 
let efficiency = 40; 
let totalMoneyEarned = 0;
let totalClicks = 0;
let infoPopupCloseTimeout = null; 
let rebirthPoints = 0;
let rebirthLevel = 0;
let totalRebirths = 0;
let rebirthMultiplier = 1.0;
let rebirthBonuses = {
    incomeBoost: 0,
    resourceCapBoost: 0,
    efficiencyBoost: 0,
    unlockBoost: 0
};
let rebirthRequirement = 1000000; 

// Population variables
let residents = [];
let maxResidents = 1;
let residentSatisfaction = 100;
let baseWaterConsumptionPerResident = 0.02; 
let baseEnergyConsumptionPerResident = 0.04; 
let baseFoodConsumptionPerResident = 0.3; 
let baseWasteProductionPerResident = 0.2;
let residentialRent = 0; 
let nextResidentId = 1; 


// Garden variables
let gardenSize = 1;
let cropYield = 1;
let gardenWaterUse = 1.0;
let isRaining = false; 
let foodProductionRate = 0;
let cropGrowthProgress = 0;

// Job System Variables
let cumulativeJobEffects = { 
    incomeBonus: 0,
    efficiencyBonus: 0,
    foodProductionBonus: 0.0,
    wasteProcessingBonus: 0.0,
    satisfactionBonus: 0
};
let jobEffectTotals = { 
    wasteProductionModifier: 1.0,
    waterConsumptionModifier: 1.0,
    energyConsumptionModifier: 1.0
};
// Status Effects Variables
let activeStatusEffects = [];

function addStatusEffect(id, name, description, type, duration = null) {
    const existingEffectIndex = activeStatusEffects.findIndex(effect => effect.id === id);
    if (existingEffectIndex !== -1) {
        if (activeStatusEffects[existingEffectIndex].timeoutId) {
            clearTimeout(activeStatusEffects[existingEffectIndex].timeoutId);
        }
        activeStatusEffects[existingEffectIndex].name = name;
        activeStatusEffects[existingEffectIndex].description = description;
        activeStatusEffects[existingEffectIndex].type = type;
        activeStatusEffects[existingEffectIndex].timeoutId = null;
    } else {
        activeStatusEffects.push({ id, name, description, type, timeoutId: null });
    }

    if (duration !== null) {
        const effectIndex = activeStatusEffects.findIndex(effect => effect.id === id);
        if (effectIndex !== -1) {
           activeStatusEffects[effectIndex].timeoutId = setTimeout(() => {
                removeStatusEffect(id);
            }, duration);
        }
    }
    updateStatusEffectsUI();
}

function removeStatusEffect(id) {
    const index = activeStatusEffects.findIndex(effect => effect.id === id);
    if (index !== -1) {
        if (activeStatusEffects[index].timeoutId) {
            clearTimeout(activeStatusEffects[index].timeoutId);
        }
        activeStatusEffects.splice(index, 1);
        updateStatusEffectsUI();
    }
}

function updateStatusEffectsUI() {
    const listElement = document.getElementById('status-effects-list');
    const panelElement = document.getElementById('status-effects-panel');
    if (!listElement || !panelElement) return;

    listElement.innerHTML = '';
    if (activeStatusEffects.length === 0) {
        listElement.innerHTML = '<li>No active effects</li>';
        panelElement.style.display = 'none';
    } else {
         panelElement.style.display = 'block';
         activeStatusEffects.forEach(effect => {
            const li = document.createElement('li');
            li.classList.add(effect.type);
            li.textContent = `${effect.name}`;
            li.title = effect.description;
            listElement.appendChild(li);
        });
    }
}
// --- End Status Effect Functions ---

// Buildings Variables
let unlockedBuildings = ['mainBuilding'];
let currentBuilding = 'mainBuilding';
let buildingCosts = {
    communityCenter: 25000,
    gardenBuilding: 15000,  
    wasteManagement: 20000  
};
let buildingData = {
    mainBuilding: {
        level: 1,
        upgrades: {},
        resources: { energy: 100, water: 100 },
        income: 0,
        buildingType: 'office',
        specialFeatures: ['solarPanels', 'rainwaterSystems', 'heatPumps', 'evChargers']
    },
    communityCenter: {
        level: 0,
        upgrades: {},
        resources: { energy: 0, water: 0 },
        income: 0,
        unlocked: false,
        buildingType: 'community',
        specialFeatures: ['communalSpaces', 'smartLighting', 'greenRoof']
    },

    gardenBuilding: {
        level: 0,
        upgrades: {},
        resources: { energy: 0, water: 0 },
        income: 0,
        unlocked: false,
        buildingType: 'garden',
        foodProduction: 0,
        cropYield: 1,
        gardenSize: 1,
        specialFeatures: ['hydroponics', 'permaculture', 'compostSystem']
    },
    wasteManagement: {
        level: 0,
        upgrades: {},
        resources: { energy: 0, water: 0 },
        income: 0,
        unlocked: false,
        buildingType: 'waste',
        wasteCapacity: 200,
        wasteProcessingRate: 1,
        specialFeatures: ['recyclingSystem', 'compostSystem']
    }
};


// Quest variables
let activeQuests = [];
let completedQuests = [];
let questProgress = {};

// 3D scene variables
let scene, camera, renderer, controls;
let ground;
let buildingGroup;
let surroundingsGroup; 
let canvas; 
let messageTimeout;
let lastFrameTime = 0;

// Building upgrades
const buildingFeatures = {
    solarPanels: { count: 0, max: 3 },
    rainwaterSystems: { count: 0, max: 2 },
    smartLighting: { count: 0, max: 1 },
    heatPumps: { count: 0, max: 1 },
    greenRoof: { count: 0, max: 1 },
    windows: { count: 0, max: 3 },
    recyclingSystem: { count: 0, max: 1 },
    evChargers: { count: 0, max: 2 },
    smartGrid: { count: 0, max: 1 },
    insulation: { count: 0, max: 2 },
    apartments: { count: 0, max: 5 },
    waterFilters: { count: 0, max: 2 },
    communalSpaces: { count: 0, max: 2 },
    hydroponics: { count: 0, max: 2 },
    compostSystem: { count: 0, max: 1 },
    permaculture: { count: 0, max: 1 },
    waterPumps: { count: 0, max: 1 }
};

// Job definitions
const jobs = {
    unemployed: { displayName: "Unemployed", building: null, effect: {} },
    janitor: {
        displayName: "Janitor",
        building: 'mainBuilding',
        effect: { wasteProductionModifier: 0.9 }
    },
    farmer: {
        displayName: "Farmer",
        building: 'gardenBuilding',
        effect: { foodProductionBonus: 0.5, waterConsumptionModifier: 1.1 } 
    },
    wasteWorker: {
        displayName: "Waste Management Worker",
        building: 'wasteManagement',
        effect: { wasteProcessingBonus: 0.2, energyConsumptionModifier: 1.05 } 
    },
    technician: {
        displayName: "Technician",
        building: 'mainBuilding', 
        effect: { efficiencyBonus: 2 }
    },
    officeWorker: {
        displayName: "Office Worker",
        building: 'mainBuilding',
        effect: { incomeBonus: 5, satisfactionBonus: 1 } 
    },
    communityManager: {
        displayName: "Community Manager",
        building: 'communityCenter',
        effect: { satisfactionBonus: 5, incomeBonus: 2 }
    }
};
// --- Job System Helper Functions ---

// Function to apply effects of a resident's current job
function applyJobEffects(resident) {
    const job = jobs[resident.job];
    if (!job || !job.effect) return;

    console.log(`Applying effects for job ${resident.job} to resident ${resident.id}`);

    // Add additive bonuses to cumulative totals
    if (job.effect.incomeBonus) {
        cumulativeJobEffects.incomeBonus += job.effect.incomeBonus;
    }
    if (job.effect.efficiencyBonus) {
        cumulativeJobEffects.efficiencyBonus += job.effect.efficiencyBonus;
    }
    if (job.effect.foodProductionBonus) {
        cumulativeJobEffects.foodProductionBonus += job.effect.foodProductionBonus;
    }
    if (job.effect.wasteProcessingBonus) {
        cumulativeJobEffects.wasteProcessingBonus += job.effect.wasteProcessingBonus;
    }
    if (job.effect.satisfactionBonus) {
        cumulativeJobEffects.satisfactionBonus += job.effect.satisfactionBonus;
    }

    // Recalculate multiplicative modifiers since the set of active jobs changed
    recalculateJobEffectTotals();
}

// Function to remove effects of a resident's previous job
function removeJobEffects(resident, previousJobId) {
    if (!previousJobId || previousJobId === 'unemployed') return;

    const previousJob = jobs[previousJobId];
    if (!previousJob || !previousJob.effect) return;

    console.log(`Removing effects for job ${previousJobId} from resident ${resident.id}`);

    // Subtract additive bonuses from cumulative totals
    if (previousJob.effect.incomeBonus) {
        cumulativeJobEffects.incomeBonus -= previousJob.effect.incomeBonus;
    }
    if (previousJob.effect.efficiencyBonus) {
        cumulativeJobEffects.efficiencyBonus -= previousJob.effect.efficiencyBonus;
    }
    if (previousJob.effect.foodProductionBonus) {
        cumulativeJobEffects.foodProductionBonus -= previousJob.effect.foodProductionBonus;
    }
    if (previousJob.effect.wasteProcessingBonus) {
        cumulativeJobEffects.wasteProcessingBonus -= previousJob.effect.wasteProcessingBonus;
    }
    if (previousJob.effect.satisfactionBonus) {
        cumulativeJobEffects.satisfactionBonus -= previousJob.effect.satisfactionBonus;
    }
    // Subtract other additive bonuses here

    // Recalculate multiplicative modifiers since the set of active jobs changed
    recalculateJobEffectTotals();
}

// Function to update a single resident's card UI in the Management tab
function updateResidentCardUI(residentId) {
    console.log(`--- Attempting to update UI for resident card ${residentId} ---`);
    const resident = residents.find(r => r.id === residentId);
    if (!resident) {
        console.error(`updateResidentCardUI: Resident data not found for ID ${residentId}`);
        return;
    }

    // Find the specific card using a data attribute
    const card = document.querySelector(`.resident-card[data-resident-id="${residentId}"]`);
    console.log(`Card element found for resident ${residentId}:`, card);
    if (!card) {
        console.error(`updateResidentCardUI: Could not find resident card element for ID ${residentId}.`);
        // updateManagementTab();
        return;
    }

    // Find elements within the card and update them
    const jobDisplay = card.querySelector('.resident-job-display');
    const skillsList = card.querySelector('.resident-skills-list');
    const selectElement = card.querySelector('.job-select');
    const assignButton = card.querySelector('.assign-job-button');

    console.log(`Elements found inside card ${residentId}:`, { jobDisplay, skillsList, selectElement, assignButton });

    if (jobDisplay) {
        jobDisplay.textContent = jobs[resident.job]?.displayName || 'Unemployed';
    } else {
        console.warn(`updateResidentCardUI: jobDisplay element not found for resident ${residentId}`);
    }

    if (skillsList && resident.skills) {
        let skillsHTML = '';
        for (const skill in resident.skills) {
            skillsHTML += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${resident.skills[skill].toFixed(1)}</li>`;
        }
        skillsList.innerHTML = skillsHTML;
    }

    // Update the dropdown selection to match the resident's current job
    if (selectElement) {
        selectElement.value = resident.job;
    }

    // Update the button text (using the 'assignButton' variable declared earlier)
    if (assignButton) { // Check if the button was found earlier
        assignButton.textContent = (resident.job === 'unemployed') ? 'Assign' : 'Change Job';
    }

    // Optionally hide/show the label
    const jobLabel = card.querySelector(`label[for="job-select-${residentId}"]`);
    if (jobLabel) {
        
    }
}

// Helper function to recalculate total multiplicative job effect modifiers
function recalculateJobEffectTotals() {
    // Reset totals to default (1.0 for multipliers)
    jobEffectTotals = {
        wasteProductionModifier: 1.0,
        waterConsumptionModifier: 1.0,
        energyConsumptionModifier: 1.0
    };

    // Iterate through all residents and apply their job's multiplicative effects
    residents.forEach(resident => {
        const job = jobs[resident.job];
        if (job && job.effect) {
            if (job.effect.wasteProductionModifier) {
                jobEffectTotals.wasteProductionModifier *= job.effect.wasteProductionModifier;
            }
            if (job.effect.waterConsumptionModifier) {
                jobEffectTotals.waterConsumptionModifier *= job.effect.waterConsumptionModifier;
            }
            if (job.effect.energyConsumptionModifier) {
                jobEffectTotals.energyConsumptionModifier *= job.effect.energyConsumptionModifier;
            }
            // Add other multiplicative modifiers here if needed
        }
    });

    console.log("Recalculated Job Effect Totals:", jobEffectTotals);
}

// --- End Job System Helper Functions ---

// Function to update management button states
function updateManagementButtonsState() {
    const residentBtn = document.getElementById('buy-resident-btn');
    if (residentBtn) {
        const cost = getManualResidentCost();
        residentBtn.textContent = `Recruit Resident ($${cost.toLocaleString()})`;
        const canAffordResident = money >= cost;
        const hasSpace = residents.length < maxResidents;
        residentBtn.disabled = !canAffordResident || !hasSpace;
        residentBtn.classList.toggle('affordable', canAffordResident && hasSpace);
        residentBtn.classList.toggle('not-affordable', !canAffordResident || !hasSpace);
    }
    const energyBtn = document.getElementById('buy-max-energy-btn');
    if (energyBtn) {
        const cost = getManualMaxEnergyCost();
        energyBtn.textContent = `Increase Max Energy (+25) ($${cost.toLocaleString()})`;
        const canAffordEnergy = money >= cost;
        energyBtn.disabled = !canAffordEnergy;
        energyBtn.classList.toggle('affordable', canAffordEnergy);
        energyBtn.classList.toggle('not-affordable', !canAffordEnergy);
    }
    const waterBtn = document.getElementById('buy-max-water-btn');
    if (waterBtn) {
        const cost = getManualMaxWaterCost();
        waterBtn.textContent = `Increase Max Water (+25) ($${cost.toLocaleString()})`;
        const canAffordWater = money >= cost;
        waterBtn.disabled = !canAffordWater;
        waterBtn.classList.toggle('affordable', canAffordWater);
        waterBtn.classList.toggle('not-affordable', !canAffordWater);
    }
}
// Helper function to count purchased upgrades
function countPurchasedUpgrades() {
    let count = 0;
    // Count purchased features from the buildingFeatures object
    for (const feature in buildingFeatures) {
        if (buildingFeatures[feature] && buildingFeatures[feature].count > 0) {
            count += buildingFeatures[feature].count;
        }
    }
    // Also count building level upgrades beyond level 1
    if (buildingLevel > 1) {
        count += (buildingLevel - 1);
    }
    return count;
}

const upgradeInfo = {
    building: {
        gameEffect: "Increases your building's size, allowing more upgrades and higher passive income.",
        realLifeBenefit: "Larger, more efficient buildings can house more people with a smaller per-person carbon footprint than multiple smaller buildings."
    },
    solarPanels: {
        gameEffect: "Reduces energy usage, increases efficiency, and provides free energy over time.",
        realLifeBenefit: "Solar panels convert sunlight into electricity, reducing reliance on fossil fuels and lowering greenhouse gas emissions."
    },
    rainwater: {
        gameEffect: "Reduces water usage and increases efficiency of your building.",
        realLifeBenefit: "Rainwater collection systems capture and store rainwater for later use in irrigation, reducing demand on municipal water supplies."
    },
    windows: {
        gameEffect: "Improves insulation, reducing energy consumption and increasing efficiency.",
        realLifeBenefit: "Energy-efficient windows use multiple panes and special coatings to prevent heat transfer, reducing heating and cooling costs."
    },
    smartLighting: {
        gameEffect: "Automatically adjusts lighting based on occupancy and natural light, reducing energy usage.",
        realLifeBenefit: "Smart lighting systems can reduce electricity use by up to 80% compared to conventional lighting."
    },
    greenRoof: {
        gameEffect: "Improves insulation, increases carbon offset, and boosts building efficiency.",
        realLifeBenefit: "Green roofs reduce urban heat islands, absorb carbon dioxide, manage stormwater runoff, and provide habitat for wildlife."
    },
    heatPumps: {
        gameEffect: "Provides efficient heating and cooling, greatly increasing building efficiency.",
        realLifeBenefit: "Heat pumps can be up to 4 times more efficient than traditional heating systems, significantly reducing energy consumption and carbon emissions."
    },
    recyclingSystem: {
        gameEffect: "Reduces waste production and slightly improves building efficiency.",
        realLifeBenefit: "On-site recycling systems divert waste from landfills, conserve raw materials, and reduce greenhouse gas emissions associated with waste disposal."
    },
    evChargers: {
        gameEffect: "Provides charging for electric vehicles and increases building efficiency.",
        realLifeBenefit: "EV charging stations promote sustainable transportation, reduce carbon emissions, and add value to commercial and residential properties."
    },
    smartGrid: {
        gameEffect: "Intelligently manages energy distribution, greatly improving efficiency.",
        realLifeBenefit: "Smart grids optimize electricity distribution, integrate renewable energy sources more effectively, and reduce energy waste and costs."
    },
    insulation: {
        gameEffect: "Improves thermal performance, reducing energy needs for heating and cooling.",
        realLifeBenefit: "Proper insulation can reduce energy consumption by up to 40%, providing both environmental benefits and significant cost savings."
    },
    apartments: {
        gameEffect: "Adds living spaces that generate rent from residents but consume resources.",
        realLifeBenefit: "Energy-efficient multi-family housing reduces per-person environmental impact and promotes community living."
    },
    waterFilters: {
        gameEffect: "Purifies and recycles greywater, significantly reducing water consumption.",
        realLifeBenefit: "Water filtration systems can reduce freshwater usage by up to 30%, conserving a precious natural resource."
    },
    communalSpaces: {
        gameEffect: "Improves resident satisfaction and reduces individual resource consumption.",
        realLifeBenefit: "Shared spaces foster community connections and reduce per-person energy and resource usage through economies of scale."
    },
    hydroponics: {
        gameEffect: "Greatly increases food production with reduced water usage.",
        realLifeBenefit: "Hydroponic systems can produce up to 10 times more food per area than traditional farming while using 90% less water."
    },
    compostSystem: {
        gameEffect: "Converts food waste into nutrients for the garden and reduces waste.",
        realLifeBenefit: "Composting diverts up to 30% of household waste from landfills while creating nutrient-rich soil for plants."
    },
    permaculture: {
        gameEffect: "Creates a self-sustaining garden ecosystem with minimal inputs.",
        realLifeBenefit: "Permaculture design mimics natural ecosystems to create sustainable agricultural systems that require minimal maintenance and external inputs."
    },
    waterPumps: {
        gameEffect: "Increases water production and reduces water consumption.",
        realLifeBenefit: "Water pumps using sustainable energy can provide clean water with reduced environmental impact compared to traditional water infrastructure."
    }
};

// Upgrade definitions
const upgrades = [
    {
        id: 'building',
        name: 'Upgrade Building',
        description: 'Increase building level and passive income',
        cost: function() { return 100 * Math.pow(2, buildingLevel - 1); },
        canBuy: function() { return buildingLevel < 5; },
        effect: function() {
            buildingLevel++;
            maxEnergy += 50;
            maxWater += 50;
            maxFood += 25;
            buildingData[currentBuilding].level = buildingLevel;
            drawBuilding();
            updateCameraPosition();
            showMessage(`Building upgraded to level ${buildingLevel}!`);
            
            // Unlock quests based on building level
            unlockQuestsByBuilding();
        }
    },
    // Re-adding first solar panel upgrade
    {
        id: 'solarPanels',
        name: 'Solar Panels',
        description: 'Generates passive energy and increases efficiency',
        cost: function() { return 150 + (buildingFeatures.solarPanels.count * 100); },
        canBuy: function() { return buildingLevel >= 1 && buildingFeatures.solarPanels.count < buildingFeatures.solarPanels.max; },
        effect: function() {
            buildingFeatures.solarPanels.count++;
            // Passive generation handled in updatePassiveIncome
            increaseEfficiency(5);
            drawBuilding();
            showMessage("Solar panel installed! Generating energy.");
            updateQuestProgress('solarPanels', buildingFeatures.solarPanels.count);
            // Removed duplicate lines
        }
    },
    {
        id: 'rainwater',
        name: 'Rainwater Collection',
        description: 'Collects water during rain and increases efficiency',
        cost: function() { return 150 + (buildingFeatures.rainwaterSystems.count * 75); },
        canBuy: function() { return buildingLevel >= 1 && buildingFeatures.rainwaterSystems.count < buildingFeatures.rainwaterSystems.max; },
        effect: function() {
            buildingFeatures.rainwaterSystems.count++;
            // Removed one-time water addition (Handled by rain mechanic)
            increaseEfficiency(4);
            drawBuilding();
            showMessage("Rainwater collection system installed! Water costs reduced.");
            
            // Check quest progress
            updateQuestProgress('rainwater', buildingFeatures.rainwaterSystems.count);
        }
    },
    {
        id: 'windows',
        name: 'Energy Efficient Windows',
        description: 'Reduces energy consumption and increases efficiency',
        cost: function() { return 200 + (buildingFeatures.windows.count * 150); },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.windows.count < buildingFeatures.windows.max; },
        effect: function() {
            buildingFeatures.windows.count++;
            energy = Math.min(maxEnergy, energy + 20);
            increaseEfficiency(6);
            drawBuilding();
            showMessage("Energy efficient windows installed! Efficiency increased.");
            
            // Check quest progress
            updateQuestProgress('windows', buildingFeatures.windows.count);
        }
    },
    {
        id: 'smartLighting',
        name: 'Smart Lighting',
        description: 'Reduces energy consumption and increases efficiency',
        cost: function() { return 250; },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.smartLighting.count < buildingFeatures.smartLighting.max; },
        effect: function() {
            buildingFeatures.smartLighting.count++;
            energy = Math.min(maxEnergy, energy + 30);
            increaseEfficiency(6);
            drawBuilding();
            showMessage("Smart lighting installed! Energy costs reduced.");
            
            // Check quest progress
            updateQuestProgress('smartLighting', buildingFeatures.smartLighting.count);
        }
    },
    {
        id: 'greenRoof',
        name: 'Green Roof',
        description: 'Reduces energy consumption, increases carbon offset, and improves efficiency',
        cost: function() { return 300; },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.greenRoof.count < buildingFeatures.greenRoof.max; },
        effect: function() {
            buildingFeatures.greenRoof.count++;
            energy = Math.min(maxEnergy, energy + 15);
            carbon += 50;
            increaseEfficiency(8);
            drawBuilding();
            showMessage("Green roof installed! Carbon offset increased.");
            
            // Check quest progress
            updateQuestProgress('greenRoof', buildingFeatures.greenRoof.count);
        }
    },
    {
        id: 'heatPumps',
        name: 'Heat Pumps',
        description: 'Greatly reduces energy consumption and increases efficiency',
        cost: function() { return 350; },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.heatPumps.count < buildingFeatures.heatPumps.max; },
        effect: function() {
            buildingFeatures.heatPumps.count++;
            energy = Math.min(maxEnergy, energy + 40);
            increaseEfficiency(10);
            drawBuilding();
            showMessage("Heat pumps installed! Efficiency greatly increased.");
            
            // Check quest progress
            updateQuestProgress('heatPumps', buildingFeatures.heatPumps.count);
        }
    },
    {
        id: 'recyclingSystem',
        name: 'Recycling System',
        description: 'Reduces waste and slightly improves efficiency',
        cost: function() { return 250; },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.recyclingSystem.count < buildingFeatures.recyclingSystem.max; },
        effect: function() {
            buildingFeatures.recyclingSystem.count++;
            waste -= 50;
            increaseEfficiency(5);
            drawBuilding();
            showMessage("Recycling system installed! Waste reduced.");
            
            // Check quest progress
            updateQuestProgress('recyclingSystem', buildingFeatures.recyclingSystem.count);
        }
    },
    {
        id: 'evChargers',
        name: 'EV Charging Stations',
        description: 'Provides charging for electric vehicles',
        cost: function() { return 200 + (buildingFeatures.evChargers.count * 150); },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.evChargers.count < buildingFeatures.evChargers.max; },
        effect: function() {
            buildingFeatures.evChargers.count++;
            increaseEfficiency(6);
            passiveIncomeFromUpgrades += 2;
            drawBuilding();
            showMessage("EV charging station installed! Passive income increased.");
            
            // Check quest progress
            updateQuestProgress('evChargers', buildingFeatures.evChargers.count);
        }
    },
    {
        id: 'smartGrid',
        name: 'Smart Grid Integration',
        description: 'Greatly reduces energy consumption and increases efficiency',
        cost: function() { return 500; },
        canBuy: function() { return buildingLevel >= 4 && buildingFeatures.smartGrid.count < buildingFeatures.smartGrid.max; },
        effect: function() {
            buildingFeatures.smartGrid.count++;
            energy = Math.min(maxEnergy, energy + 30);
            increaseEfficiency(10);
            drawBuilding();
            showMessage("Smart grid installed! Energy efficiency greatly increased.");
            
            // Check quest progress
            updateQuestProgress('smartGrid', buildingFeatures.smartGrid.count);
        }
    },
    {
        id: 'insulation',
        name: 'Advanced Insulation',
        description: 'Reduces energy consumption and increases efficiency',
        cost: function() { return 250 + (buildingFeatures.insulation.count * 150); },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.insulation.count < buildingFeatures.insulation.max; },
        effect: function() {
            buildingFeatures.insulation.count++;
            energy = Math.min(maxEnergy, energy + 25);
            increaseEfficiency(7);
            drawBuilding();
            showMessage("Advanced insulation installed! Energy efficiency improved.");
            
            // Check quest progress
            updateQuestProgress('insulation', buildingFeatures.insulation.count);
        }
    },
    {
        id: 'apartments',
        name: 'Residential Apartments',
        description: 'Adds living spaces for residents',
        cost: function() { return 300 + (buildingFeatures.apartments.count * 200); },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.apartments.count < buildingFeatures.apartments.max; },
        effect: function() {
            buildingFeatures.apartments.count++;
            maxResidents += 5;
            residentialRent += 5;
            drawBuilding();
            showMessage("Residential apartments added! You can now house more residents.");
            
            // Check quest progress
            updateQuestProgress('apartments', buildingFeatures.apartments.count);
        }
    },
    {
        id: 'waterFilters',
        name: 'Water Filtration System',
        description: 'Purifies and recycles greywater',
        cost: function() { return 200 + (buildingFeatures.waterFilters.count * 150); },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.waterFilters.count < buildingFeatures.waterFilters.max; },
        effect: function() {
            buildingFeatures.waterFilters.count++;
            water = Math.min(maxWater, water + 50);
            baseWaterConsumptionPerResident *= 0.7; // Keep original logic for now
            increaseEfficiency(5);
            drawBuilding();
            showMessage("Water filtration system installed! Water consumption reduced.");
    
            // Now updateQuestProgress uses the CORRECT, incremented count
            updateQuestProgress('waterFilters', buildingFeatures.waterFilters.count);
        }
    },
    {
        id: 'communalSpaces',
        name: 'Communal Living Spaces',
        description: 'Improves resident satisfaction',
        cost: function() { return 350 + (buildingFeatures.communalSpaces.count * 200); },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.communalSpaces.count < buildingFeatures.communalSpaces.max; },
        effect: function() {
            buildingFeatures.communalSpaces.count++; // <<< --- ADD THIS LINE
            residentSatisfaction = Math.min(100, residentSatisfaction + 10);
            // Similar note as waterFilters: multiplying the base rate repeatedly might be very strong.
            baseEnergyConsumptionPerResident *= 0.8; // Keep original logic for now
            increaseEfficiency(6);
            drawBuilding();
            showMessage("Communal spaces added! Resident satisfaction improved.");
    
            // Now updateQuestProgress uses the CORRECT, incremented count
            updateQuestProgress('communalSpaces', buildingFeatures.communalSpaces.count);
        }
    },
    {
        id: 'hydroponics',
        name: 'Hydroponic System',
        description: 'Greatly increases food yield with reduced water usage',
        cost: function() { return 300 + (buildingFeatures.hydroponics.count * 250); },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.hydroponics.count < buildingFeatures.hydroponics.max; },
        effect: function() {
            buildingFeatures.hydroponics.count++;
            cropYield += 2;
            gardenWaterUse *= 0.6;
            // foodProductionRate += 3;
            drawBuilding();
            showMessage("Hydroponic system installed! Food production greatly increased.");
            
            // Check quest progress
            updateQuestProgress('hydroponics', buildingFeatures.hydroponics.count);
        }
    },
    {
        id: 'compostSystem',
        name: 'Composting System',
        description: 'Converts food waste into garden nutrients',
        cost: function() { return 200; },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.compostSystem.count < buildingFeatures.compostSystem.max; },
        effect: function() {
            buildingFeatures.compostSystem.count++;
            cropYield += 1;
            // Convert waste to garden nutrients
            waste = Math.max(0, waste - 50);
            // foodProductionRate += 1;
            drawBuilding();
            showMessage("Composting system installed! Waste converted to nutrients.");
            
            // Check quest progress
            updateQuestProgress('compostSystem', buildingFeatures.compostSystem.count);
        }
    },
    {
        id: 'permaculture',
        name: 'Permaculture Design',
        description: 'Creates a self-sustaining garden ecosystem',
        cost: function() { return 400; },
        canBuy: function() { return buildingLevel >= 3 && buildingFeatures.permaculture.count < buildingFeatures.permaculture.max; },
        effect: function() {
            buildingFeatures.permaculture.count++;
            cropYield += 1.5;
            gardenWaterUse *= 0.7;
            carbon += 30;
            // foodProductionRate += 2;
            drawBuilding();
            showMessage("Permaculture design implemented! Garden is more self-sustaining.");
            
            // Check quest progress
            updateQuestProgress('permaculture', buildingFeatures.permaculture.count);
        }
    },
    {
        id: 'waterPumps',
        name: 'Water Pumps',
        description: 'Install water pumps to increase water production',
        cost: function() { return 300 + (buildingFeatures.waterPumps.count * 250); },
        canBuy: function() { return buildingLevel >= 2 && buildingFeatures.waterPumps.count < buildingFeatures.waterPumps.max; },
        effect: function() {
            buildingFeatures.waterPumps.count++;
            // Removed one-time water addition (Passive generation from pumps handled elsewhere)
            // waterConsumptionPerResident *= 0.8;
            increaseEfficiency(4);
            drawBuilding();
            showMessage("Water pump installed! Water production increased.");
            
            // Check quest progress
            updateQuestProgress('waterPumps', buildingFeatures.waterPumps.count);
        }
    }
];

// Add garden upgrades to the upgrades array
const gardenUpgrades = [
    {
        id: 'expandGarden',
        name: 'Expand Garden',
        description: 'Increases garden size and potential food production',
        cost: function() { return 150 * (gardenSize); },
        canBuy: function() { return buildingLevel >= 1 && gardenSize < 5; },
        effect: function() {
            gardenSize++;
            foodProductionRate += 1;
            drawBuilding();
            showMessage("Garden expanded! Food production capacity increased.");
            
            // Check quest progress
            updateQuestProgress('gardenSize', gardenSize);
        }
    },
];

// Helper function to increase efficiency with a cap at 100%
function increaseEfficiency(amount) {
    efficiency = Math.min(100, efficiency + amount);
    addStatusEffect('efficiencyBoost', 'Efficiency Increased', `+${amount}% Efficiency`, 'buff', 5000);
    // updateUI(); // Call might be redundant if updateUI runs frequently
}

// Quest system
const quests = [
    {
        id: 'firstUpgrade',
        name: 'First Upgrade',
        description: 'Purchase your first building upgrade',
        requirement: function() { return countPurchasedUpgrades() >= 1; },
        reward: function() { 
            money += 100;
            showMessage("Quest completed: First Upgrade! Earned $100");
        },
        unlockLevel: 1
    },
    {
        id: 'efficientWindows',
        name: 'Efficient Windows',
        description: 'Install 2 energy efficient windows',
        requirement: function() { return buildingFeatures.windows.count >= 2; },
        reward: function() { 
            money += 200;
            energy += 50;
            showMessage("Quest completed: Efficient Windows! Earned $200 and 50 energy");
        },
        unlockLevel: 2
    },
    {
        id: 'solarPower',
        name: 'Solar Power',
        description: 'Install all 3 solar panels',
        requirement: function() { return buildingFeatures.solarPanels.count >= 3; },
        reward: function() { 
            money += 300;
            energy += 100;
            showMessage("Quest completed: Solar Power! Earned $300 and 100 energy");
        },
        unlockLevel: 2
    },
    {
        id: 'greenBuilding',
        name: 'Green Building',
        description: 'Reach 70% building efficiency',
        requirement: function() { return efficiency >= 70; },
        reward: function() { 
            money += 400;
            carbon += 50;
            showMessage("Quest completed: Green Building! Earned $400 and 50 carbon offset");
        },
        unlockLevel: 3
    },
    {
        id: 'sustainableLiving',
        name: 'Sustainable Living',
        description: 'Install a green roof and a heat pump',
        requirement: function() { 
            return buildingFeatures.greenRoof.count >= 1 && buildingFeatures.heatPumps.count >= 1; 
        },
        reward: function() { 
            money += 500;
            carbon += 100;
            showMessage("Quest completed: Sustainable Living! Earned $500 and 100 carbon offset");
        },
        unlockLevel: 3
    },
    {
        id: 'waterSaver',
        name: 'Water Saver',
        description: 'Install both rainwater collection systems',
        requirement: function() { return buildingFeatures.rainwaterSystems.count >= 2; },
        reward: function() { 
            money += 250;
            water += 100;
            showMessage("Quest completed: Water Saver! Earned $250 and 100 water");
        },
        unlockLevel: 2
    },
    {
        id: 'electricMobility',
        name: 'Electric Mobility',
        description: 'Install both EV charging stations',
        requirement: function() { return buildingFeatures.evChargers.count >= 2; },
        reward: function() { 
            money += 350;
            passiveIncomeFromUpgrades += 3;
            showMessage("Quest completed: Electric Mobility! Earned $350 and +3 passive income");
        },
        unlockLevel: 3
    },
    {
        id: 'netZero',
        name: 'Net Zero Building',
        description: 'Reach 100% building efficiency',
        requirement: function() { return efficiency >= 100; },
        reward: function() { 
            money += 1000;
            passiveIncomeFromUpgrades += 10;
            showMessage("Quest completed: Net Zero Building! Earned $1000 and +10 passive income");
        },
        unlockLevel: 4
    },
    {
        id: 'moneyMaker',
        name: 'Money Maker',
        description: 'Earn a total of $5000',
        requirement: function() { return totalMoneyEarned >= 5000; },
        reward: function() { 
            money += 500;
            moneyPerClick += 1;
            showMessage("Quest completed: Money Maker! Earned $500 and +1 money per click");
        },
        unlockLevel: 2
    },
    {
        id: 'clickMaster',
        name: 'Click Master',
        description: 'Click on your building 100 times',
        requirement: function() { return totalClicks >= 100; },
        reward: function() { 
            money += 200;
            moneyPerClick += 2;
            showMessage("Quest completed: Click Master! Earned $200 and +2 money per click");
        },
        unlockLevel: 1
    },
    // --- Waste Management Upgrades ---
    {
        id: 'advancedSorting',
        name: 'Advanced Sorting Tech',
        description: 'Improves waste processing efficiency, reducing landfill.',
        cost: function() { return 250 + (buildingFeatures.advancedSorting?.count || 0) * 150; }, // Use optional chaining for safety
        canBuy: function() {
            // Requires Waste Management building unlocked and level >= 1
            return buildingData.wasteManagement?.unlocked && buildingData.wasteManagement?.level >= 1 &&
                   (buildingFeatures.advancedSorting?.count || 0) < (buildingFeatures.advancedSorting?.max || 3);
        },
        effect: function() {
            if (!buildingFeatures.advancedSorting) { // Initialize if doesn't exist
                 buildingFeatures.advancedSorting = { count: 0, max: 3 };
            }
            buildingFeatures.advancedSorting.count++;
            // Increase passive waste reduction rate
            passiveWasteReduction += 0.1; // Reduce 0.1 waste per tick per upgrade level (adjust rate as needed)
            showMessage("Advanced Sorting Tech installed! Waste processing improved.");
            // updateQuestProgress('advancedSorting', buildingFeatures.advancedSorting.count); // Add quest if needed
        }
    },
    // --- Community Center Upgrades ---
     {
        id: 'communityEvents',
        name: 'Organize Community Events',
        description: 'Boosts resident satisfaction and community spirit.',
        cost: function() { return 300 + (buildingFeatures.communityEvents?.count || 0) * 200; },
        canBuy: function() {
            return buildingData.communityCenter?.unlocked && buildingData.communityCenter?.level >= 1 &&
                   (buildingFeatures.communityEvents?.count || 0) < (buildingFeatures.communityEvents?.max || 5);
        },
        effect: function() {
             if (!buildingFeatures.communityEvents) { // Initialize if doesn't exist
                 buildingFeatures.communityEvents = { count: 0, max: 5 };
            }
            buildingFeatures.communityEvents.count++;
            residentSatisfaction = Math.min(100, residentSatisfaction + 5); // Increase satisfaction cap might be needed later
            // passiveIncome += 1;
            showMessage("Community Event organized! Resident satisfaction increased.");
        }
    }
];

// Initialize quests based on building level
function unlockQuestsByBuilding() {
    quests.forEach(quest => {
        if (!activeQuests.includes(quest.id) && 
            !completedQuests.includes(quest.id) && 
            buildingLevel >= quest.unlockLevel) {
            activeQuests.push(quest.id);
            showMessage(`New quest available: ${quest.name}!`);
            addStatusEffect(`quest_${quest.id}`, 'New Quest!', quest.name, 'buff', 10000);
            updateQuestsTab();
        }
    });
}

// Update quest progress
function updateQuestProgress(type, value) {
    questProgress[type] = value;
    checkQuestCompletion();
}

// Check if any quests have been completed
function checkQuestCompletion() {
    activeQuests.forEach(questId => {
        if (!completedQuests.includes(questId)) {
            const quest = quests.find(q => q.id === questId);
            if (quest && quest.requirement()) {
                // Complete the quest
                completeQuest(quest);
            }
        }
    });
}

// Complete a quest
function completeQuest(quest) {
    // Remove from active quests
    activeQuests = activeQuests.filter(id => id !== quest.id);
    
    // Add to completed quests
    completedQuests.push(quest.id);
    
    // Give reward
    quest.reward();
    removeStatusEffect(`quest_${quest.id}`);
    
    // Update UI
    updateQuestsTab();
    updateUI();
}

// Update quests tab with current quests
function updateQuestsTab() {
    const questsTab = document.getElementById('quests-tab');
    if (!questsTab) return;
    
    // Clear existing quests
    questsTab.innerHTML = '<h3>Quests</h3>';
    
    // Create active quests section
    const activeQuestsSection = document.createElement('div');
    activeQuestsSection.className = 'quests-section';
    activeQuestsSection.innerHTML = '<h4>Active Quests</h4>';
    
    // Add active quests
    if (activeQuests.length > 0) {
        const questsList = document.createElement('ul');
        activeQuests.forEach(questId => {
            const quest = quests.find(q => q.id === questId);
            if (quest) {
                const questItem = document.createElement('li');
                questItem.className = 'quest-item';
                questItem.innerHTML = `
                    <div class="quest-name">${quest.name}</div>
                    <div class="quest-description">${quest.description}</div>
                `;
                questsList.appendChild(questItem);
            }
        });
        activeQuestsSection.appendChild(questsList);
    } else {
        activeQuestsSection.innerHTML += '<p>No active quests. Upgrade your building to unlock more quests!</p>';
    }
    
    // Create completed quests section
    const completedQuestsSection = document.createElement('div');
    completedQuestsSection.className = 'quests-section';
    completedQuestsSection.innerHTML = '<h4>Completed Quests</h4>';
    
    // Add completed quests
    if (completedQuests.length > 0) {
        const completedList = document.createElement('ul');
        completedQuests.forEach(questId => {
            const quest = quests.find(q => q.id === questId);
            if (quest) {
                const questItem = document.createElement('li');
                questItem.className = 'quest-item completed';
                questItem.innerHTML = `
                    <div class="quest-name">${quest.name} ✓</div>
                    <div class="quest-description">${quest.description}</div>
                `;
                completedList.appendChild(questItem);
            }
        });
        completedQuestsSection.appendChild(completedList);
    } else {
        completedQuestsSection.innerHTML += '<p>No completed quests yet.</p>';
    }
    
    // Add sections to tab
    questsTab.appendChild(activeQuestsSection);
    questsTab.appendChild(completedQuestsSection);
}

// Initialize when document is ready
window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    setTimeout(init, 2000);
});

// Also listen for window load event as a fallback
window.addEventListener('load', function() {
    console.log("Window fully loaded");
    init();
});

// Function to switch between UI tabs
function switchTab(tabId) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tabcontent');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // Deactivate all tab links
    const tabLinks = document.querySelectorAll('.tablinks');
    tabLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected tab content and activate the link
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    // Find the button corresponding to the tabId and activate it
    const activeButton = document.querySelector(`.tablinks[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Special handling: Update management tab only when it's switched to
    if (tabId === 'management-tab') {
        updateManagementTab();
    }
}

// Function to switch between UI tabs
function switchTab(tabId) {
    // Hide all tab content
    const tabContents = document.querySelectorAll('.tabcontent');
    tabContents.forEach(content => {
        content.style.display = 'none';
    });

    // Deactivate all tab links
    const tabLinks = document.querySelectorAll('.tablinks');
    tabLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Show the selected tab content and activate the link
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    // Find the button corresponding to the tabId and activate it
    const activeButton = document.querySelector(`.tablinks[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Special handling: Update management tab only when it's switched to
    if (tabId === 'management-tab') {
        updateManagementTab();
    }
}

// Initialize the game
function init() {
    console.log("Initializing game...");
    // Setup 3D scene
        setupScene();
        
        // Setup UI
        setupUI();
        
        // Unlock initial quests
        unlockQuestsByBuilding();
        
        setupUpgrades(); 
    
    // Add event listeners
    setupEventListeners();

    // Update quests tab initially
    updateQuestsTab(); 

    updateStatusEffectsUI(); 

    // Start the game loop intervals
    setInterval(updatePassiveIncome, 333);
    setInterval(reduceResources, 1000);
    setInterval(updateUI, 1000);
    setInterval(checkResidentSpawn, 5000);

    // Start animation loop
    animate();
    

    console.log("Game initialized successfully");
}

// Setup enhanced event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Get the canvas element
    canvas = document.getElementById('game-canvas');
    
    // Tab navigation
    const tabLinks = document.querySelectorAll('.tablinks');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Camera control buttons
    setupCameraButtons();
    
    
    // Building unlock buttons
    const unlockButtons = document.querySelectorAll('.unlock-building-button');
    unlockButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const buildingId = e.target.closest('.building-card').getAttribute('data-building');
            if (buildingId) {
                unlockBuilding(buildingId);
            }
        });
    });
    
    // Building view buttons - Delegate to document for dynamically created elements
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-building-button')) {
            const buildingId = e.target.getAttribute('data-building') || 
                              e.target.closest('.building-card')?.getAttribute('data-building');
            if (buildingId && unlockedBuildings.includes(buildingId)) {
                switchBuilding(buildingId);
            }
        }
    });
    
    // Rebirth button
    const rebirthButton = document.getElementById('rebirth-button');
    if (rebirthButton) {
        rebirthButton.addEventListener('click', rebirth);
    }
    
    // Building click for money
    canvas.addEventListener('click', handleBuildingClick);
    
    console.log("Event listeners set up");
    // Management Tab Actions (Event Delegation)
    const managementTab = document.getElementById('management-tab');
    if (managementTab) {
        managementTab.addEventListener('click', (event) => {
            // Manual Purchases
            if (event.target.id === 'buy-resident-btn') {
                 // console.log("Buy Resident button clicked");
                buyResidentManual();
            } else if (event.target.id === 'buy-max-energy-btn') {
                 // console.log("Buy Energy button clicked");
                buyMaxEnergy();
            } else if (event.target.id === 'buy-max-water-btn') {
                 // console.log("Buy Water button clicked");
                buyMaxWater();
            }
            // Assign Job Button (Keep existing logic here if present)
            else if (event.target.classList.contains('assign-job-button')) {
                const residentId = parseInt(event.target.dataset.residentId, 10);
                const selectElement = document.getElementById(`job-select-${residentId}`);
                if (selectElement) {
                    const jobId = selectElement.value;
                    assignJob(residentId, jobId);
                } else {
                    console.error(`Could not find select element for resident ${residentId}`);
                    showMessage(`Error assigning job for resident ${residentId}.`, 'error');
                }
            }
        });
    } else {
        console.error("Management tab element not found for delegation.");
    }

    // Add delegated event listener for assign job buttons
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('assign-job-button')) {
            const residentId = parseInt(event.target.getAttribute('data-resident-id'));
            const selectElement = document.getElementById(`job-select-${residentId}`);
            if (selectElement) {
                const jobId = selectElement.value;
                assignJob(residentId, jobId);
            } else {
                console.error(`Could not find select element for resident ${residentId}`);
                showMessage(`Error assigning job for resident ${residentId}.`, 'error');
            }
        }
    });
    document.getElementById('resident-list')?.addEventListener('click', handleAssignJobClick);

    // Add delegated event listener for assign job buttons
    document.getElementById('resident-list')?.addEventListener('click', handleAssignJobClick);
}

// Helper function to update DOM elements safely
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    } else {
        console.warn(`Element with ID '${id}' not found when trying to update to '${value}'`);
    }
}

// Handle building click for money
function handleBuildingClick(event) {
    // Get normalized device coordinates
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Create a ray from the camera
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);
    
    // Check for intersections with the building
    const intersects = raycaster.intersectObject(buildingGroup, true);
    
    if (intersects.length > 0) {
        // Increment money based on click value
        const clickValue = moneyPerClick * (1 + (efficiency / 100)) * rebirthMultiplier;
        money += clickValue;
        totalMoneyEarned += clickValue;
        totalClicks++;
        
        // Create floating text effect
        createFloatingText(event.clientX, event.clientY, `+$${clickValue.toFixed(1)}`);
        
        // Update UI
        updateUI();
        
        
        // Check quest progress
        updateQuestProgress('clicks', totalClicks);
    }
}

// Setup UI elements with new features
function setupUI() {
    console.log("Setting up UI...");
    
    // Setup tabs
    setupTabs();
    
    // Setup camera buttons
    setupCameraButtons();
    
    // Setup upgrade buttons
    setupUpgrades();
    
    // Setup action buttons for garden and residents
    setupActionButtons();
    
    // Setup rebirth UI
    updateRebirthUI();
    
    // Setup building UI
    updateBuildingsUI();
    
    // Create quests tab
    if (!document.getElementById('quests-tab')) {
        createQuestsTab();
    }
    
    // Update quests tab
    updateQuestsTab();
    
    // Update UI with initial values
    updateUI();
    
    console.log("UI setup complete");
}

// Update UI based on current game state
function updateUI() {
    // Update Population Tab
    updatePopulationTab();
    updateStatusEffectsUI(); 

    updateStatusEffectsUI();
    
    updateElement('money-display', Math.floor(money).toLocaleString());
    updateElement('energy-display', `${Math.floor(energy)} / ${Math.floor(maxEnergy)}`);
    updateElement('water-display', `${Math.floor(water)} / ${Math.floor(maxWater)}`);
    updateElement('food-display', `${Math.floor(food)}`);
    updateElement('carbon-display', Math.floor(carbon).toLocaleString());
    
    // Always Update Management Tab Buttons State
     updateManagementButtonsState();

    // Update efficiency display
    updateElement('efficiency-value', Math.floor(efficiency) + '%');
    
    // Update building info
    updateElement('building-level', buildingData[currentBuilding].level);
    
    // Update costs based on the current building
    const energyCost = 5.0 * buildingData[currentBuilding].level * (1 - (buildingFeatures.solarPanels.count * 0.15));
    const waterCost = 5.0 * buildingData[currentBuilding].level * (1 - (buildingFeatures.rainwaterSystems.count * 0.2));
    const carbonBonus = 5.0 * buildingData[currentBuilding].level;
    
    updateElement('energy-cost', energyCost.toFixed(1));
    updateElement('water-cost', waterCost.toFixed(1));
    updateElement('carbon-bonus', carbonBonus.toFixed(1));
    updateElement('passive-income', passiveIncomeFromUpgrades.toFixed(1));

    // Update Stats Tab elements
    updateElement('total-clicks', totalClicks.toLocaleString());
    updateElement('total-money-earned', Math.floor(totalMoneyEarned).toLocaleString());
    // Update stats tab passive income display using passiveIncomeFromUpgrades
    updateElement('stat-passive-income', passiveIncomeFromUpgrades.toFixed(1));
    updateElement('stat-building-level', buildingData[currentBuilding].level); // Assuming current building level for stats
    updateElement('upgrade-count', countPurchasedUpgrades()); // Need a function to count upgrades
    updateElement('total-carbon-offset', Math.floor(carbon).toLocaleString()); 
    updateElement('stat-residents', residents.length); 

    // Update features list
    updateFeaturesList();
    
    // Update buildings UI - always call this when UI updates
    updateBuildingsUI();
    
    // Call specific UI updates based on current building type
    switch(buildingData[currentBuilding].buildingType) {
        case 'garden':
            updateGardenUI();
            break;
        case 'waste':
            updateWasteUI();
            break;
        case 'community':
            updateCommunityUI();
            break;
        case 'lab':
            updateResearchUI();
            break;
        case 'energy':
            updateEnergyUI();
            break;
        case 'water':
            updateWaterUI();
            break;
        default:
            // Main building
            break;
    }
    
    // Update rebirth UI 
    updateRebirthUI();
    
    // Update upgrades to show correct ones for current building
    updateUpgradeButtons(); 
}

// Function to update the buildings tab UI
function updateBuildingsUI() {
    const buildingCards = document.querySelectorAll('.building-card');
    
    buildingCards.forEach(card => {
        const buildingId = card.dataset.building;
        const unlockButton = card.querySelector('.unlock-building-button');
        const viewButton = card.querySelector('.view-building-button') || createViewButton(buildingId);
        
        // If the building is unlocked
        if (unlockedBuildings.includes(buildingId)) {
            // Update the card to show it's unlocked
            card.classList.remove('locked');
            
            // Hide unlock button and show level
            if (unlockButton) {
                unlockButton.style.display = 'none';
            }
            
            // Update building level display
            const levelSpan = card.querySelector(`#${buildingId.replace(/([A-Z])/g, '-$1').toLowerCase()}-level`) || 
                              card.querySelector('span[id$="-level"]');
            if (levelSpan) {
                levelSpan.textContent = buildingData[buildingId].level || 1;
            }
            
            // Make sure the view button is visible
            if (viewButton && !card.contains(viewButton)) {
                card.appendChild(viewButton);
            }
            
            // If this is the current building, mark it as selected
            if (buildingId === currentBuilding) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        } else {
            // Make sure the card shows as locked
            card.classList.add('locked');
            card.classList.remove('selected');

            // Make the unlock button visible and reflect affordability
            if (unlockButton) {
                const cost = buildingCosts[buildingId];
                unlockButton.textContent = `Unlock ($${cost.toLocaleString()})`;
                if (money >= cost) {
                    unlockButton.classList.add('affordable');
                    unlockButton.classList.remove('not-affordable');
                    unlockButton.disabled = false;
                } else {
                    unlockButton.classList.remove('affordable');
                    unlockButton.classList.add('not-affordable');
                    unlockButton.disabled = true;
                }
                unlockButton.style.display = 'inline-block';
            }

            // Hide view button for locked buildings
            if (viewButton) {
                viewButton.style.display = 'none';
            }
        }
    });
}

// Helper function to create a view button for a building
function createViewButton(buildingId) {
    const viewButton = document.createElement('button');
    viewButton.className = 'view-building-button';
    viewButton.textContent = 'View';
    viewButton.dataset.building = buildingId;
    
    // Add click handler
    viewButton.addEventListener('click', function() {
        switchBuilding(buildingId);
    });
    
    return viewButton;
}

// Function to update the features list in the UI
function updateFeaturesList(buildingId = currentBuilding) {
    const featuresList = document.getElementById('features-list');
    if (!featuresList) return;
    
    // Clear the current list
    featuresList.innerHTML = '';
    
    // Add active features for the current building
    const activeFeatures = [];
    const buildingFeatures = buildingData[buildingId]?.features || {};
    
    // Check each feature type and add if count > 0 for this specific building
    Object.entries(buildingFeatures).forEach(([feature, data]) => {
        if (data && data.count > 0) {
            switch(feature) {
                case 'solarPanels':
                    activeFeatures.push(`Solar Panels (${data.count})`);
                    break;
                case 'rainwaterSystems':
                    activeFeatures.push(`Rainwater Collection (${data.count})`);
                    break;
                case 'windows':
                    activeFeatures.push(`Energy Efficient Windows (${data.count})`);
                    break;
                
            }
        }
    });
    
    // Add items to the list
    if (activeFeatures.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No features installed';
        featuresList.appendChild(li);
    } else {
        activeFeatures.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresList.appendChild(li);
        });
    }
}

// Setup Three.js scene
function setupScene() {
    console.log("Setting up main scene");
    canvas = document.getElementById('game-canvas');
    
    // Create a scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Create a camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 50);
    camera.lookAt(0, 0, 0);
    
    // Create a renderer
    if (!canvas) {
        console.error("Main game canvas not found!");
        return;
    }
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Create orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controls.minDistance = 10;
    controls.maxDistance = 100;
    
    // Create lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);
    
    // Create groups for organizing scene elements
    buildingGroup = new THREE.Group();
    surroundingsGroup = new THREE.Group();
    
    scene.add(buildingGroup);
    scene.add(surroundingsGroup);
    
    // Add a new group for surroundings
    surroundingsGroup = new THREE.Group();
    scene.add(surroundingsGroup);
    
    // Draw the building
    drawBuilding();
}

// Draw the primary building
function drawBuilding() {
    console.log(`Drawing ${currentBuilding} at level ${buildingData[currentBuilding].level}`);
    
    // Clear current building group
    while(buildingGroup.children.length > 0){ 
        buildingGroup.remove(buildingGroup.children[0]); 
    }
    
    // Get building specs based on level
    const level = buildingData[currentBuilding].level || 1;
    
    // Adjust scaling to make taller buildings with increasing levels
    const width = 10 + (level * 2);
    // Height increases more significantly with each level
    const height = 5 * level;
    const depth = 10 + (level * 2);
    
    console.log(`Building dimensions: width=${width}, height=${height}, depth=${depth}`);
    
    // Create building materials (modify based on building type)
    let buildingMaterial, roofMaterial;
    
    // Create different materials based on building type
    switch(currentBuilding) {
        case 'mainBuilding':
            buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.6 });
            roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
            break;
        case 'communityCenter':
            buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFE4C4, roughness: 0.5 });
            roofMaterial = new THREE.MeshStandardMaterial({ color: 0xCD853F, roughness: 0.4 });
            break;
        case 'gardenBuilding':
            buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x98FB98, roughness: 0.7, transparent: true, opacity: 0.8 });
            roofMaterial = new THREE.MeshStandardMaterial({ color: 0x006400, roughness: 0.5 });
            break;
        case 'wasteManagement':
            buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.6 });
            roofMaterial = new THREE.MeshStandardMaterial({ color: 0xA52A2A, roughness: 0.5 });
            break;
        default:
            buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE, roughness: 0.6 });
            roofMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
    }
    
    if (currentBuilding === 'gardenBuilding') {
        // Create a greenhouse-style building
        const greenhouseGeometry = new THREE.BoxGeometry(width, height, depth);
        const greenhouse = new THREE.Mesh(greenhouseGeometry, buildingMaterial);
        greenhouse.position.y = height / 2;
        greenhouse.castShadow = true;
        greenhouse.receiveShadow = true;
        buildingGroup.add(greenhouse);
        
        // Add a triangular roof
        const roofHeight = height / 2;
        const greenhouseRoofGeometry = new THREE.ConeGeometry(width / 1.5, roofHeight, 4);
        const greenhouseRoof = new THREE.Mesh(greenhouseRoofGeometry, roofMaterial);
        greenhouseRoof.position.y = height + roofHeight / 2;
        greenhouseRoof.rotation.y = Math.PI / 4;
        greenhouseRoof.castShadow = true;
        buildingGroup.add(greenhouseRoof);
        
        // Add greenhouse structure
        const frameThickness = 0.3;
        // Vertical frames
        for (let x = -width/2; x <= width/2; x += width/4) {
            const frameGeometry = new THREE.BoxGeometry(frameThickness, height, frameThickness);
            const frame = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x006400 }));
            frame.position.set(x, height/2, depth/2);
            buildingGroup.add(frame);
            
            const frame2 = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x006400 }));
            frame2.position.set(x, height/2, -depth/2);
            buildingGroup.add(frame2);
        }
        
        // Horizontal frames
        for (let y = 0; y <= height; y += height/3) {
            const frameGeometry = new THREE.BoxGeometry(width, frameThickness, frameThickness);
            const frame = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x006400 }));
            frame.position.set(0, y, depth/2);
            buildingGroup.add(frame);
            
            const frame2 = new THREE.Mesh(frameGeometry, new THREE.MeshStandardMaterial({ color: 0x006400 }));
            frame2.position.set(0, y, -depth/2);
            buildingGroup.add(frame2);
        }
        
        // Add plants
        const plantMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 });
        for (let i = 0; i < 10; i++) {
            const plantSize = 0.3 + Math.random() * 0.5;
            const plantGeometry = new THREE.ConeGeometry(plantSize, plantSize * 2, 5);
            const plant = new THREE.Mesh(plantGeometry, plantMaterial);
            const x = (Math.random() - 0.5) * (width - 2);
            const z = (Math.random() - 0.5) * (depth - 2);
            plant.position.set(x, plantSize, z);
            buildingGroup.add(plant);
        }
    }

    else if (currentBuilding === 'wasteManagement') {
        // Create waste management facility with containers
        const mainGeometry = new THREE.BoxGeometry(width, height, depth);
        const mainBuilding = new THREE.Mesh(mainGeometry, buildingMaterial);
        mainBuilding.position.y = height / 2;
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        buildingGroup.add(mainBuilding);
        
        // Add flat roof
        const wasteRoofGeometry = new THREE.BoxGeometry(width + 2, 1, depth + 2);
        const wasteRoof = new THREE.Mesh(wasteRoofGeometry, roofMaterial);
        wasteRoof.position.y = height + 0.5;
        wasteRoof.castShadow = true;
        buildingGroup.add(wasteRoof);
        
        // Add smokestacks
        const stackRadius = width / 20;
        const stackHeight = height / 2;
        const stackGeometry = new THREE.CylinderGeometry(stackRadius, stackRadius, stackHeight, 8);
        const stackMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
        
        for (let i = 0; i < 2; i++) {
            const stack = new THREE.Mesh(stackGeometry, stackMaterial);
            const x = (i - 0.5) * (width / 3);
            stack.position.set(x, height + stackHeight/2, -depth/4);
            buildingGroup.add(stack);
        }
        
        // Add waste containers
        const containerWidth = width / 6;
        const containerHeight = height / 5;
        const containerDepth = depth / 4;
        const containerColors = [0x2E8B57, 0x1E90FF, 0xFFD700, 0xDC143C];
        
        for (let i = 0; i < 4; i++) {
            const containerGeometry = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
            const container = new THREE.Mesh(containerGeometry, new THREE.MeshStandardMaterial({
                color: containerColors[i % containerColors.length],
                roughness: 0.7
            }));
            const x = (i - 1.5) * (containerWidth * 1.5);
            container.position.set(x, containerHeight/2, depth/1.5);
            buildingGroup.add(container);
        }
    } else {
        // Standard building
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        buildingGroup.add(building);
        
        // Add roof
        const standardRoofGeometry = new THREE.BoxGeometry(width + 2, 1, depth + 2);
        const standardRoof = new THREE.Mesh(standardRoofGeometry, roofMaterial);
        standardRoof.position.y = height + 0.5;
        standardRoof.castShadow = true;
        standardRoof.receiveShadow = true;
        buildingGroup.add(standardRoof);
    }
    
    // Add windows for all building types except greenhouse
    if (currentBuilding !== 'gardenBuilding') {
        addBuildingWindows(width, height, depth);
    }
    
    // Add building-specific features based on the building type
    const buildingType = buildingData[currentBuilding].buildingType || 'main';
    
    // For main building (default)
    if (buildingType === 'main' || currentBuilding === 'mainBuilding') {
        // Main building features
        if (buildingFeatures.solarPanels.count > 0) {
            addSolarPanels(width, height, depth);
        }
        
        if (buildingFeatures.rainwaterSystems.count > 0) {
            addRainwaterSystem(width, height, depth);
        }
        
        if (buildingFeatures.smartLighting.count > 0) {
            addSmartLighting(width, height, depth);
        }
        
        if (buildingFeatures.heatPumps.count > 0) {
            addHeatPumps(width, height, depth);
        }
    }
    // Garden building features
    else if (buildingType === 'garden' || currentBuilding === 'gardenBuilding') {
        // Garden-specific features like hydroponics, water pumps, etc.
        if (buildingFeatures.hydroponics && buildingFeatures.hydroponics.count > 0) {
            // Add hydroponics visuals if implemented
        }
        
        if (buildingFeatures.waterPumps && buildingFeatures.waterPumps.count > 0) {
            // Add water pumps visuals if implemented
        }
    }
    // Waste management features
    else if (buildingType === 'waste' || currentBuilding === 'wasteManagement') {
        if (buildingFeatures.recyclingSystem && buildingFeatures.recyclingSystem.count > 0) {
            addRecyclingSystem(width, height, depth);
        }
        
        if (buildingFeatures.compostSystem && buildingFeatures.compostSystem.count > 0) {
            // Add compost system visuals if implemented
        }
    }
    // Energy plant features
    else if (buildingType === 'energy' || currentBuilding === 'energyPlant') {
        if (buildingFeatures.solarPanels.count > 0) {
            addSolarPanels(width, height, depth);
        }
        
        if (buildingFeatures.smartGrid && buildingFeatures.smartGrid.count > 0) {
            addSmartGrid(width, height, depth);
        }
    }
    // Water treatment features
    else if (buildingType === 'water' || currentBuilding === 'waterTreatment') {
        if (buildingFeatures.rainwaterSystems.count > 0) {
            addRainwaterSystem(width, height, depth);
        }
        
        if (buildingFeatures.waterFilters && buildingFeatures.waterFilters.count > 0) {
            // Add water filters visuals if implemented
        }
    }
    
    // Add surroundings based on the current building
    createSurroundings();
}

// Function to create surroundings around the building
function createSurroundings() {
    // Clear existing surroundings
    while(surroundingsGroup.children.length > 0){ 
        surroundingsGroup.remove(surroundingsGroup.children[0]); 
    }
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x7cba7a, 
        roughness: 0.8
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    surroundingsGroup.add(ground);
    
    // Add trees based on building type
    addTrees();
    
    // Add paths
    addPaths();
    
    // Add decorative elements
    addDecorations();
}

// Function to add trees around the building
function addTrees() {
    const treeCount = 15 + Math.floor(Math.random() * 10);
    const buildingSize = 10 + (buildingData[currentBuilding].level * 2);
    const exclusionRadius = buildingSize * 1.2; // Keep trees away from building
    
    // Tree materials
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x2E8B57, roughness: 0.8 });
    
    for (let i = 0; i < treeCount; i++) {
        // Generate random position away from building
        let x, z;
        do {
            x = (Math.random() - 0.5) * 180;
            z = (Math.random() - 0.5) * 180;
        } while (Math.sqrt(x*x + z*z) < exclusionRadius);
        
        // Randomize tree size
        const trunkHeight = 1 + Math.random() * 2;
        const trunkRadius = 0.2 + Math.random() * 0.3;
        const leafSize = 1 + Math.random() * 1.5;
        
        // Create trunk
        const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius * 1.2, trunkHeight, 8);
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, trunkHeight / 2, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        surroundingsGroup.add(trunk);
        
        // Create leaves - either cone or sphere based on tree type
        if (Math.random() > 0.5) {
            // Cone shaped trees (like pines)
            const leafGeometry = new THREE.ConeGeometry(leafSize, leafSize * 2, 8);
            const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
            leaves.position.set(x, trunkHeight + leafSize, z);
            leaves.castShadow = true;
            surroundingsGroup.add(leaves);
        } else {
            // Rounded trees
            const leafGeometry = new THREE.SphereGeometry(leafSize, 8, 8);
            const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
            leaves.position.set(x, trunkHeight + leafSize / 1.5, z);
            leaves.castShadow = true;
            surroundingsGroup.add(leaves);
        }
    }
}

// Function to add paths around the building
function addPaths() {
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C, roughness: 1.0 });
    
    // Main path to building
    const mainPathGeometry = new THREE.PlaneGeometry(5, 30);
    const mainPath = new THREE.Mesh(mainPathGeometry, pathMaterial);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.set(0, 0, 25);
    mainPath.receiveShadow = true;
    surroundingsGroup.add(mainPath);
    
    // Circular path around building
    const buildingSize = 10 + (buildingData[currentBuilding].level * 2);
    const pathRadius = buildingSize * 1.5;
    const circularPathGeometry = new THREE.RingGeometry(pathRadius - 2, pathRadius, 32);
    const circularPath = new THREE.Mesh(circularPathGeometry, pathMaterial);
    circularPath.rotation.x = -Math.PI / 2;
    circularPath.position.y = 0.01; // Slightly above ground to prevent z-fighting
    circularPath.receiveShadow = true;
    surroundingsGroup.add(circularPath);
}

// Function to add decorative elements
function addDecorations() {
    // Different decorations based on building type
    switch(currentBuilding) {
        case 'gardenBuilding':
            addGardenDecorations();
            break;
        case 'wasteManagement':
            addWasteManagementDecorations();
            break;
        case 'energyPlant':
            addEnergyPlantDecorations();
            break;
        case 'waterTreatment':
            addWaterDecorations();
            break;
        default:
            addDefaultDecorations();
    }
}

// Add garden-specific decorations
function addGardenDecorations() {
    // Add flower beds
    const flowerColors = [0xFF6B6B, 0x4ECDC4, 0xFFD166, 0xF896D8];
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const distance = 20;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create flower bed
        const bedGeometry = new THREE.CylinderGeometry(3, 3, 0.5, 16);
        const bedMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(x, 0.25, z);
        surroundingsGroup.add(bed);
        
        // Add flowers
        for (let j = 0; j < 12; j++) {
            const flowerAngle = (j / 12) * Math.PI * 2;
            const flowerDistance = 2;
            const flowerX = x + Math.sin(flowerAngle) * flowerDistance;
            const flowerZ = z + Math.cos(flowerAngle) * flowerDistance;
            
            const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8);
            const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.set(flowerX, 0.6, flowerZ);
            surroundingsGroup.add(stem);
            
            const flowerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const flowerMaterial = new THREE.MeshStandardMaterial({ 
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)] 
            });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(flowerX, 1.0, flowerZ);
            surroundingsGroup.add(flower);
        }
    }
}

// Add waste management decorations
function addWasteManagementDecorations() {
    // Add dumpsters and recycling bins
    const containerColors = [0x2E8B57, 0x1E90FF, 0xFFD700, 0xDC143C];
    
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 30 + Math.random() * 10;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create container
        const containerWidth = 2 + Math.random();
        const containerHeight = 1.5 + Math.random() * 0.5;
        const containerDepth = 1.5 + Math.random() * 0.5;
        
        const containerGeometry = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
        const containerMaterial = new THREE.MeshStandardMaterial({ 
            color: containerColors[i % containerColors.length],
            roughness: 0.7
        });
        
        const container = new THREE.Mesh(containerGeometry, containerMaterial);
        container.position.set(x, containerHeight/2, z);
        container.rotation.y = Math.random() * Math.PI * 2;
        container.castShadow = true;
        container.receiveShadow = true;
        surroundingsGroup.add(container);
        
        // Add lid
        const lidGeometry = new THREE.BoxGeometry(containerWidth + 0.1, 0.2, containerDepth + 0.1);
        const lid = new THREE.Mesh(lidGeometry, containerMaterial);
        lid.position.set(x, containerHeight + 0.1, z);
        lid.rotation.y = container.rotation.y;
        lid.castShadow = true;
        surroundingsGroup.add(lid);
    }
}

// Add energy plant decorations
function addEnergyPlantDecorations() {
    // Add wind turbines
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const distance = 40;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create tower
        const towerHeight = 12 + Math.random() * 4;
        const towerGeometry = new THREE.CylinderGeometry(0.5, 0.7, towerHeight, 12);
        const towerMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.5 });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(x, towerHeight/2, z);
        tower.castShadow = true;
        tower.receiveShadow = true;
        surroundingsGroup.add(tower);
        
        // Create nacelle (turbine housing)
        const nacelleGeometry = new THREE.BoxGeometry(1.5, 1, 3);
        const nacelleMaterial = new THREE.MeshStandardMaterial({ color: 0xE0E0E0, roughness: 0.6 });
        const nacelle = new THREE.Mesh(nacelleGeometry, nacelleMaterial);
        nacelle.position.set(x, towerHeight, z);
        nacelle.castShadow = true;
        surroundingsGroup.add(nacelle);
        
        // Create blades
        const bladeGroup = new THREE.Group();
        bladeGroup.position.set(x, towerHeight, z);
        bladeGroup.rotation.z = Math.random() * Math.PI * 2;
        surroundingsGroup.add(bladeGroup);
        
        for (let j = 0; j < 3; j++) {
            const bladeGeometry = new THREE.BoxGeometry(0.2, 7, 1);
            const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.4 });
            const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(0, 3.5, 0);
            blade.rotation.z = (j / 3) * Math.PI * 2;
            blade.castShadow = true;
            bladeGroup.add(blade);
        }
    }
}

// Add water treatment decorations
function addWaterDecorations() {
    // Add water pools and pumps
    for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const distance = 25;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create pool
        const poolGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
        const poolMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x1E90FF, 
            roughness: 0.3,
            transparent: true,
            opacity: 0.7
        });
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.set(x, 0.5, z);
        pool.receiveShadow = true;
        surroundingsGroup.add(pool);
        
        // Create pool edge
        const edgeGeometry = new THREE.TorusGeometry(5, 0.3, 16, 32);
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.7 });
        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        edge.position.set(x, 1, z);
        edge.rotation.x = Math.PI / 2;
        edge.castShadow = true;
        surroundingsGroup.add(edge);
        
        // Add pipes
        const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(x, 2, z);
        pipe.castShadow = true;
        surroundingsGroup.add(pipe);
        
        // Add filter equipment
        const filterGeometry = new THREE.BoxGeometry(3, 1.5, 2);
        const filterMaterial = new THREE.MeshStandardMaterial({ color: 0xA9A9A9, roughness: 0.5 });
        const filter = new THREE.Mesh(filterGeometry, filterMaterial);
        filter.position.set(x + 7, 0.75, z);
        filter.castShadow = true;
        filter.receiveShadow = true;
        surroundingsGroup.add(filter);
    }
}

// Add default decorations for other buildings
function addDefaultDecorations() {
    // Add benches
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const distance = 25;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create bench seat
        const seatGeometry = new THREE.BoxGeometry(3, 0.2, 1);
        const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(x, 0.7, z);
        seat.rotation.y = angle + Math.PI/2;
        seat.castShadow = true;
        seat.receiveShadow = true;
        surroundingsGroup.add(seat);
        
        // Create bench legs
        for (let j = -1; j <= 1; j += 2) {
            const legGeometry = new THREE.BoxGeometry(0.2, 0.7, 1);
            const legMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.7 });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x + Math.cos(angle + Math.PI/2) * j, 0.35, z + Math.sin(angle + Math.PI/2) * j);
            leg.rotation.y = angle + Math.PI/2;
            leg.castShadow = true;
            leg.receiveShadow = true;
            surroundingsGroup.add(leg);
        }
        
        // Create bench backrest
        const backGeometry = new THREE.BoxGeometry(3, 1, 0.2);
        const back = new THREE.Mesh(backGeometry, seatMaterial);
        back.position.set(x + Math.sin(angle) * 0.5, 1.3, z - Math.cos(angle) * 0.5);
        back.rotation.y = angle + Math.PI/2;
        back.castShadow = true;
        surroundingsGroup.add(back);
    }
    
    // Add some lampposts
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const distance = 35;
        const x = Math.sin(angle) * distance;
        const z = Math.cos(angle) * distance;
        
        // Create lamppost pole
        const poleGeometry = new THREE.CylinderGeometry(0.2, 0.3, 5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.6 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 2.5, z);
        pole.castShadow = true;
        pole.receiveShadow = true;
        surroundingsGroup.add(pole);
        
        // Create lamp
        const lampGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const lampMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFF9C4, 
            emissive: 0xFFF59D,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
        lamp.position.set(x, 5.3, z);
        surroundingsGroup.add(lamp);
        
        // Add a light source
        const light = new THREE.PointLight(0xFFF9C4, 0.5, 20);
        light.position.set(x, 5.3, z);
        surroundingsGroup.add(light);
    }
}


// Add building features based on upgrades and current building
function addBuildingFeatures() {
    const buildingType = buildingData[currentBuilding].buildingType;
    const buildingSpecialties = buildingData[currentBuilding].specialFeatures || [];
    const width = buildingGroup.children[0].geometry.parameters.width;
    const height = buildingGroup.children[0].geometry.parameters.height;
    const depth = buildingGroup.children[0].geometry.parameters.depth;
    
    // Add features based on building specialty
    buildingSpecialties.forEach(feature => {
        if (buildingFeatures[feature] && buildingFeatures[feature].count > 0) {
            switch(feature) {
                case 'solarPanels':
                    addSolarPanels(width, height, depth);
                    break;
                case 'rainwaterSystems':
                    addRainwaterSystem(width, height, depth);
                    break;
                case 'smartLighting':
                    addSmartLighting(width, height, depth);
                    break;
                case 'heatPumps':
                    addHeatPumps(width, height, depth);
                    break;
                case 'recyclingSystem':
                    addRecyclingSystem(width, height, depth);
                    break;
                case 'evChargers':
                    addEVChargers(width, height, depth);
                    break;
                case 'smartGrid':
                    addSmartGrid(width, height, depth);
                    break;
                case 'waterPumps':
                    addWaterPumps(width, height, depth);
                    break;
                // Add more cases for other features
            }
        }
    });
}

// Add building windows with improved positioning
function addBuildingWindows(width, height, depth) {
    // Choose window color based on energy efficient windows upgrade
    const windowColor = buildingFeatures.windows.count > 0 ? 0x2980b9 : 0x87CEEB;
    const windowOpacity = buildingFeatures.windows.count > 0 ? 0.5 : 0.7;
    
    const windowMaterial = new THREE.MeshLambertMaterial({ 
        color: windowColor,
        transparent: true,
        opacity: windowOpacity,
        side: THREE.DoubleSide
    });
    
    // Get the actual dimensions to ensure windows are on the surface
    const actualWidth = width || 10; 
    const actualDepth = depth || 10; 
    
    // Small offset to ensure windows are on the surface
    const surfaceOffset = 0.05;
    
    // Use the current building's level instead of the global buildingLevel
    const currentBuildingLevel = buildingData[currentBuilding].level || 1;
    
    // Add windows for each floor
    for (let floor = 0; floor < currentBuildingLevel; floor++) {
        const floorHeight = 5 * floor + 3;
        
        // Front windows
        addWindowWithFrame(-3, floorHeight, actualDepth/2 + surfaceOffset, 0, 0, 0, windowMaterial);
        addWindowWithFrame(3, floorHeight, actualDepth/2 + surfaceOffset, 0, 0, 0, windowMaterial);
        
        // Back windows
        addWindowWithFrame(-3, floorHeight, -actualDepth/2 - surfaceOffset, 0, Math.PI, 0, windowMaterial);
        addWindowWithFrame(3, floorHeight, -actualDepth/2 - surfaceOffset, 0, Math.PI, 0, windowMaterial);
        
        // Left side windows
        addWindowWithFrame(-actualWidth/2 - surfaceOffset, floorHeight, -3, 0, Math.PI/2, 0, windowMaterial);
        addWindowWithFrame(-actualWidth/2 - surfaceOffset, floorHeight, 3, 0, Math.PI/2, 0, windowMaterial);
        
        // Right side windows
        addWindowWithFrame(actualWidth/2 + surfaceOffset, floorHeight, -3, 0, -Math.PI/2, 0, windowMaterial);
        addWindowWithFrame(actualWidth/2 + surfaceOffset, floorHeight, 3, 0, -Math.PI/2, 0, windowMaterial);
    }
}

// Add a window with a frame around it
function addWindowWithFrame(x, y, z, rotX, rotY, rotZ, windowMaterial) {
    // Window frame
    const frameGeometry = new THREE.BoxGeometry(2, 2, 0.1);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.set(x, y, z);
    frame.rotation.set(rotX, rotY, rotZ);
    buildingGroup.add(frame);
    
    // Window glass (slightly smaller than the frame)
    const windowGeometry = new THREE.PlaneGeometry(1.5, 1.5);
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    
    // Copy position from frame
    window.position.copy(frame.position);
    
    // Apply offset based on rotation to prevent z-fighting
    const offset = 0.06;
    if (rotY === 0 || rotY === 0.0) {
        window.position.z += offset;
    } else if (Math.abs(rotY) === Math.PI) {
        window.position.z -= offset;
    } else if (rotY === Math.PI/2) {
        window.position.x -= offset;
    } else if (rotY === -Math.PI/2) {
        window.position.x += offset;
    }
    
    window.rotation.set(rotX, rotY, rotZ);
    buildingGroup.add(window);
}

// Add solar panels (Simplified Visuals)
function addSolarPanels(width, height, depth) {
    if (buildingFeatures.solarPanels.count <= 0) return;

    const panelCount = buildingFeatures.solarPanels.count;
    const panelAreaWidth = width * 0.8; // Cover 80% of width
    const panelAreaDepth = depth * 0.8; // Cover 80% of depth
    
    // Simple representation: a slightly raised, dark blue plane on the roof
    const panelPlaneGeometry = new THREE.PlaneGeometry(panelAreaWidth, panelAreaDepth);
    const panelPlaneMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a237e, // Dark blue
        roughness: 0.6,
        metalness: 0.3
    });
    const panelPlane = new THREE.Mesh(panelPlaneGeometry, panelPlaneMaterial);
    
    // Position slightly above the roof
    panelPlane.rotation.x = -Math.PI / 2;
    panelPlane.position.y = height + 1.1;
    panelPlane.receiveShadow = true;

    buildingGroup.add(panelPlane);
    
}

// Add rainwater collection system
function addRainwaterSystem(width, height, depth) {
    for (let i = 0; i < buildingFeatures.rainwaterSystems.count; i++) {
        // Add rain barrel
        const barrelGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
        const barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x3498db });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        
        // Position barrels based on count
        let barrelX, barrelZ;
        
        if (i === 0) {
            barrelX = -width/2 - 1.5;
            barrelZ = depth/3;
        } else {
            barrelX = width/2 + 1.5;
            barrelZ = depth/3;
        }
        
        barrel.position.set(barrelX, 1, barrelZ);
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        buildingGroup.add(barrel);
        
        // Add pipe from roof to barrel
        const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, height, 8);
        const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe.position.set(barrelX, height/2, barrelZ + 0.8);
        buildingGroup.add(pipe);
    }
}

// Add smart lighting visual cues
function addSmartLighting(width, height, depth) {
    // Add some light glows near windows to indicate smart lighting
    for (let floor = 0; floor < buildingLevel; floor++) {
        const floorHeight = 5 * floor + 3;
        
        // Create point lights with slight colors
        const colors = [0xf39c12, 0x2ecc71, 0x3498db, 0x9b59b6];
        
        for (let i = 0; i < 2; i++) {
            const light = new THREE.PointLight(
                colors[Math.floor(Math.random() * colors.length)], 
                0.5,  // Intensity
                3     // Distance
            );
            light.position.set(
                (Math.random() - 0.5) * width * 0.8, 
                floorHeight, 
                (Math.random() - 0.5) * depth * 0.8
            );
            buildingGroup.add(light);
        }
    }
}

// Add heat pumps
function addHeatPumps(width, height, depth) {
    // Add heat pump units outside the building
    const pumpGeometry = new THREE.BoxGeometry(2, 1.5, 1);
    const pumpMaterial = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
    const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
    pump.position.set(-width/2 - 1, 0.75, -depth/3);
    pump.castShadow = true;
    pump.receiveShadow = true;
    buildingGroup.add(pump);
    
    // Add vents to the heat pump
    const ventGeometry = new THREE.PlaneGeometry(1.5, 0.8);
    const ventMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x555555,
        side: THREE.DoubleSide
    });
    
    const vent1 = new THREE.Mesh(ventGeometry, ventMaterial);
    vent1.position.set(0, 0, 0.51);
    vent1.rotation.y = Math.PI;
    pump.add(vent1);
    
    // Add pipes connecting to building
    const pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
    const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
    pipe.position.set(-width/2 + 0.2, 0.75, -depth/3);
    pipe.rotation.z = Math.PI/2;
    buildingGroup.add(pipe);
}

// Add recycling system
function addRecyclingSystem(width, height, depth) {
    // Add recycling bins
    const binColors = [0x3498db, 0x2ecc71, 0xf1c40f, 0xe74c3c];
    
    for (let i = 0; i < 4; i++) {
        const binGeometry = new THREE.BoxGeometry(0.8, 1, 0.8);
        const binMaterial = new THREE.MeshLambertMaterial({ color: binColors[i] });
        const bin = new THREE.Mesh(binGeometry, binMaterial);
        
        // Position bins in a row near the side of the building
        bin.position.set(
            -width/2 - 1.5 + (i * 1),
            0.5,
            depth/2 - 1
        );
        
        bin.castShadow = true;
        bin.receiveShadow = true;
        buildingGroup.add(bin);
        
        // Add lid
        const lidGeometry = new THREE.BoxGeometry(0.9, 0.1, 0.9);
        const lidMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.5;
        bin.add(lid);
        
        // Add recycling symbol
        const symbolGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const symbolMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
        symbol.rotation.x = Math.PI / 2;
        symbol.position.y = 0.55;
        lid.add(symbol);
    }
}

// Add EV charging stations
function addEVChargers(width, height, depth) {
    for (let i = 0; i < buildingFeatures.evChargers.count; i++) {
        // Create charging station
        const baseGeometry = new THREE.BoxGeometry(1, 0.2, 1);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        
        // Position chargers based on count
        let posX, posZ;
        
        if (i === 0) {
            posX = width/2 + 2;
            posZ = depth/4;
        } else {
            posX = width/2 + 2;
            posZ = -depth/4;
        }
        
        base.position.set(posX, 0.1, posZ);
        base.castShadow = true;
        base.receiveShadow = true;
        buildingGroup.add(base);
        
        // Add charging post
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        const postMaterial = new THREE.MeshLambertMaterial({ color: 0xecf0f1 });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 0.75;
        base.add(post);
        
        // Add charging head
        const headGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.3);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x34495e });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.6;
        head.position.x = 0.25;
        post.add(head);
        
        // Add charging cable
        const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        const cableMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        const cable = new THREE.Mesh(cableGeometry, cableMaterial);
        cable.position.y = -0.3;
        cable.position.x = 0.2;
        cable.rotation.x = Math.PI / 3;
        head.add(cable);
    }
}

// Add smart grid indicators
function addSmartGrid(width, height, depth) {
    // Add small smart meter on the building
    const meterGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const meterMaterial = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
    const meter = new THREE.Mesh(meterGeometry, meterMaterial);
    meter.position.set(width/2 + 0.3, 3, -depth/3);
    meter.castShadow = true;
    meter.receiveShadow = true;
    buildingGroup.add(meter);
    
    // Add display screen
    const screenGeometry = new THREE.PlaneGeometry(0.8, 0.6);
    const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x2ecc71 });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.z = 0.26;
    meter.add(screen);
    
    // Add power lines
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 8, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(width/2 + 5, 4, -depth/3);
    pole.castShadow = true;
    pole.receiveShadow = true;
    buildingGroup.add(pole);
    
    // Add transformers and other details to make it look like a smart grid connection
    const transformerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const transformerMaterial = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
    const transformer = new THREE.Mesh(transformerGeometry, transformerMaterial);
    transformer.position.y = 3.5;
    pole.add(transformer);
    
    // Add blinking light for visual effect
    const lightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.y = 0.2;
    transformer.add(light);
    
    // Create blinking animation for the light
    setInterval(() => {
        if (light) {
            lightMaterial.color.set(Math.random() > 0.5 ? 0xe74c3c : 0x2ecc71);
        }
    }, 1000);
}

// Setup upgrade buttons in the upgrades tab
function setupUpgrades() {
    const upgradesContainer = document.getElementById('upgrades-tab');
    if (!upgradesContainer) return;
    
    // Clear existing upgrade buttons
    const upgradesList = document.createElement('div');
    upgradesList.className = 'upgrade-list';
    upgradesContainer.innerHTML = '<h3>Upgrades</h3>';
    upgradesContainer.appendChild(upgradesList);
    
    // Get building-specific upgrades
    const availableUpgrades = getBuildingUpgrades(currentBuilding);
    
    // Add upgrade buttons for available upgrades
    availableUpgrades.forEach(upgrade => {
        if (upgrade.canBuy()) {
            const cost = upgrade.cost();
            const canAfford = money >= cost;
            
            const button = document.createElement('button');
            button.className = `upgrade-button ${canAfford ? '' : 'disabled'}`;
            button.disabled = !canAfford;
            button.dataset.upgradeId = upgrade.id;
            
            button.innerHTML = `
                <div>
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                </div>
                <div class="upgrade-cost ${canAfford ? 'affordable' : 'not-affordable'}">$${cost}</div>
            `;
            
            button.addEventListener('click', () => {
                if (money >= upgrade.cost()) {
                    money -= upgrade.cost();
                    upgrade.effect();
                    checkQuestCompletion();
                    setupUpgrades();
                    updateUI();

                    // Show educational popup
                    showUpgradeInfo(upgrade.id);
                } else {
                    showMessage("Not enough money!");
                }
            });
            
            // Add hover listeners for info popup
            button.addEventListener('mouseenter', () => {
                // Clear any pending close timeout
                if (infoPopupCloseTimeout) {
                    clearTimeout(infoPopupCloseTimeout);
                    infoPopupCloseTimeout = null;
                }
                
                // Close all other popups immediately
                closeAllInfoPopups();
                
                // Show info for this upgrade
                showUpgradeInfo(upgrade.id);
            });

            button.addEventListener('mouseleave', () => {
                const popupId = 'info-popup-' + upgrade.id;
                const popupToClose = document.getElementById(popupId);
                
                // Clear any existing timeout before setting a new one
                if (infoPopupCloseTimeout) {
                    clearTimeout(infoPopupCloseTimeout);
                }

                if (popupToClose) {
                    // Set a global timeout to close this specific popup after a delay
                    infoPopupCloseTimeout = setTimeout(() => {
                        closeInfoPopup(popupToClose);
                        infoPopupCloseTimeout = null;
                    }, 300);
                }
            });
            
            upgradesList.appendChild(button);
        }
    });
    
    // Show message if no upgrades available
    if (upgradesList.children.length === 0) {
        const message = document.createElement('p');
        message.textContent = "No upgrades available. Try increasing your building level.";
        upgradesList.appendChild(message);
    }
}

// Function to get building-specific upgrades
function getBuildingUpgrades(buildingId) {
    // Default upgrades for main building (can be overridden)
    const buildingUpgrades = [...upgrades];
    
    // Add building-specific upgrades based on building type
    switch(buildingData[buildingId].buildingType) {
        case 'garden':
            // Combine 'expandGarden' from gardenUpgrades with specific upgrades from the main list
            const specificGardenUpgrades = upgrades.filter(upgrade =>
                ['hydroponics', 'compostSystem', 'permaculture'].includes(upgrade.id)
            );
            return [...gardenUpgrades, ...specificGardenUpgrades];
        case 'waste': // Waste Management Building
            return upgrades.filter(upgrade =>
                ['advancedSorting', 'buildingUpgrade'].includes(upgrade.id) // Add buildingUpgrade if applicable
            );
        case 'community': // Community Center Building
            return upgrades.filter(upgrade =>
                ['communityEvents', 'insulation', 'windows', 'communalSpaces', 'greenRoof', 'buildingUpgrade'].includes(upgrade.id) // Add buildingUpgrade if applicable
            );
        case 'lab':
            return buildingUpgrades.filter(upgrade => 
                ['windows', 'smartGrid', 'recyclingSystem', 'buildingUpgrade'].includes(upgrade.id)
            );
        case 'energy':
            return buildingUpgrades.filter(upgrade => 
                ['solarPanels', 'smartGrid', 'heatPumps', 'buildingUpgrade'].includes(upgrade.id)
            );
        case 'water':
            return buildingUpgrades.filter(upgrade => 
                ['rainwater', 'waterFilters', 'waterPumps', 'buildingUpgrade'].includes(upgrade.id)
            );
        default:
            return buildingUpgrades;
    }
}

// Create and show educational popup for upgrades
function showUpgradeInfo(upgradeId) {
    // Get info for the upgrade
    const info = upgradeInfo[upgradeId];
    if (!info) return;
    
    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'info-popup';
    popup.id = 'info-popup-' + upgradeId;
    
    // Get the upgrade name
    const upgradeName = upgrades.find(u => u.id === upgradeId)?.name || "Upgrade";
    
    // Create popup content
    popup.innerHTML = `
        <div class="popup-header">
            <h3>${upgradeName}</h3>
            <button class="close-button">×</button>
        </div>
        <div class="popup-content">
            <div class="info-section">
                <h4>In-Game Effect</h4>
                <p>${info.gameEffect}</p>
            </div>
            <div class="info-section">
                <h4>Real-Life Benefit</h4>
                <p>${info.realLifeBenefit}</p>
            </div>
        </div>
    `;
    
    // Add popup to document
    document.body.appendChild(popup);
    
    // Show popup with animation
    setTimeout(() => {
        popup.classList.add('visible');
    }, 10);
    
    // Add close button functionality
    const closeButton = popup.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        closeInfoPopup(popup);
    });
    
    // Auto-close after 15 seconds
    setTimeout(() => {
        if (document.body.contains(popup)) {
            closeInfoPopup(popup);
        }
    }, 15000);
}

// Helper function to close an info popup with animation
function closeInfoPopup(popup) {
    popup.classList.remove('visible');
    setTimeout(() => {
        if (document.body.contains(popup)) {
            popup.remove();
        }
    }, 300);
}

// Close all info popups
function closeAllInfoPopups() {
    const existingPopups = document.querySelectorAll('.info-popup');
    existingPopups.forEach(popup => {
        closeInfoPopup(popup);
    });
}

// Update upgrade button states without recreating them
function updateUpgradeButtons() {
    const upgradesTab = document.getElementById('upgrades-tab');
    if (!upgradesTab || !isTabVisible('upgrades-tab')) return;
    
    const upgradeButtons = upgradesTab.querySelectorAll('.upgrade-button');
    
    upgradeButtons.forEach(button => {
        const upgradeId = button.dataset.upgradeId;
        const upgrade = upgrades.find(u => u.id === upgradeId);
        
        if (upgrade) {
            const cost = upgrade.cost();
            const canAfford = money >= cost;
            
            // Update button state
            button.classList.toggle('disabled', !canAfford);
            button.disabled = !canAfford;
            
            // Update cost display (in case it's changed)
            const costElement = button.querySelector('.upgrade-cost');
            if (costElement) {
                costElement.textContent = `$${cost}`;
                costElement.className = `upgrade-cost ${canAfford ? 'affordable' : 'not-affordable'}`;
            }
        }
    });
}

// Check if a specific tab is currently visible
function isTabVisible(tabId) {
    const tab = document.getElementById(tabId);
    return tab && tab.classList.contains('active');
}

// Setup tabs
function setupTabs() {
    const tabContainer = document.querySelector('.tab');
    if (!tabContainer) return;
    
    // Add a Quests tab if it doesn't exist
    if (!document.querySelector('button[data-tab="quests-tab"]')) {
        const questsButton = document.createElement('button');
        questsButton.className = 'tablinks';
        questsButton.dataset.tab = 'quests-tab';
        questsButton.textContent = 'Quests';
        tabContainer.appendChild(questsButton);
    }
    
    const tabButtons = document.querySelectorAll('.tablinks');
    const tabContents = document.querySelectorAll('.tabcontent');
    
    if (tabButtons.length > 0 && tabContents.length > 0) {
        // Set first tab as active by default
        tabButtons[0].classList.add('active');
        const firstTabId = tabButtons[0].dataset.tab;
        const firstTab = document.getElementById(firstTabId);
        if (firstTab) {
            firstTab.classList.add('active');
            firstTab.style.display = 'block';
        }
        
        // Add click event listeners
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Hide all tab contents
                tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.display = 'none';
                });
                
                // Remove active class from all buttons
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Show the selected tab content
                const selectedTab = document.getElementById(tabId);
                if (selectedTab) {
                    selectedTab.classList.add('active');
                    selectedTab.style.display = 'block';
                }
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Refresh upgrades when opening upgrades tab
                if (tabId === 'upgrades-tab') {
                    setupUpgrades();
                }
                
                // Refresh quests when opening quests tab
                if (tabId === 'quests-tab') {
                    updateQuestsTab();
                }
            });
        });
    }
}

// Create quests tab
function createQuestsTab() {
    const tabcontent = document.getElementById('tabcontent');
    if (!tabcontent) return;
    
    const questsTab = document.createElement('div');
    questsTab.id = 'quests-tab';
    questsTab.className = 'tabcontent';
    questsTab.innerHTML = '<h3>Quests</h3>';
    
    tabcontent.appendChild(questsTab);
}

// Setup camera buttons
function setupCameraButtons() {
    // Front view
    const frontButton = document.getElementById('camera-front');
    if (frontButton) {
        frontButton.addEventListener('click', (event) => {
            event.preventDefault();
            camera.position.set(0, 10, 30);
            camera.lookAt(0, 5, 0);
            controls.update();
        });
    }
    
    // Top view
    const topButton = document.getElementById('camera-top');
    if (topButton) {
        topButton.addEventListener('click', (event) => {
            event.preventDefault();
            camera.position.set(0, 40, 0);
            camera.lookAt(0, 0, 0);
            controls.update();
        });
    }
    
    // Side view
    const sideButton = document.getElementById('camera-side');
    if (sideButton) {
        sideButton.addEventListener('click', (event) => {
            event.preventDefault();
            camera.position.set(30, 10, 0);
            camera.lookAt(0, 5, 0);
            controls.update();
        });
    }
    
    // Reset view
    const resetButton = document.getElementById('camera-reset');
    if (resetButton) {
        resetButton.addEventListener('click', (event) => {
            event.preventDefault();
            updateCameraPosition();
            controls.update();
        });
    }
}

// Setup debug controls
function setupDebugControls() {
    const debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) return;
    
    // Add money button
    const addMoneyButton = document.getElementById('add-money');
    if (addMoneyButton) {
        addMoneyButton.addEventListener('click', () => {
            const amountInput = document.getElementById('debug-money');
            const amount = parseInt(amountInput?.value || '0', 10);
            if (amount > 0) {
                money += amount;
                showMessage(`Added $${amount} (debug)`);
                updateUI();
            }
        });
    }
    
    // Add energy button
    const addEnergyButton = document.getElementById('add-energy');
    if (addEnergyButton) {
        addEnergyButton.addEventListener('click', () => {
            const amountInput = document.getElementById('debug-resources');
            const amount = parseInt(amountInput?.value || '0', 10);
            if (amount > 0) {
                energy += amount;
                showMessage(`Added ${amount} energy (debug)`);
                updateUI();
            }
        });
    }
    
    // Add water button
    const addWaterButton = document.getElementById('add-water');
    if (addWaterButton) {
        addWaterButton.addEventListener('click', () => {
            const amountInput = document.getElementById('debug-resources');
            const amount = parseInt(amountInput?.value || '0', 10);
            if (amount > 0) {
                water += amount;
                showMessage(`Added ${amount} water (debug)`);
                updateUI();
            }
        });
    }
    
    // Add carbon button
    const addCarbonButton = document.getElementById('add-carbon');
    if (addCarbonButton) {
        addCarbonButton.addEventListener('click', () => {
            const amountInput = document.getElementById('debug-resources');
            const amount = parseInt(amountInput?.value || '0', 10);
            if (amount > 0) {
                carbon += amount;
                showMessage(`Added ${amount} carbon offset (debug)`);
                updateUI();
            }
        });
    }
    
    // Toggle FPS display
    const toggleFPSButton = document.getElementById('toggle-fps');
    if (toggleFPSButton) {
        let fpsEnabled = false;
        toggleFPSButton.addEventListener('click', () => {
            fpsEnabled = !fpsEnabled;
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.style.display = fpsEnabled ? 'inline' : 'none';
            }
        });
    }
}

// Update camera position based on building level
function updateCameraPosition() {
    const distanceFactor = 15 + buildingLevel * 3;
    const heightFactor = 8 + buildingLevel * 2;
    
    camera.position.set(distanceFactor, heightFactor, distanceFactor);
    camera.lookAt(0, heightFactor / 3, 0);
}

// Handle window resize
function onWindowResize() {
    // Update canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Update camera aspect ratio and projection matrix
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    console.log("Window resized, updated renderer dimensions");
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    // Check for resident spawning - Moved to setInterval in init()
    // checkResidentSpawn();

    // Update controls
    if (controls) controls.update();

    lastFrameTime = time;
    
    // Render scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Setup additional action buttons
function setupActionButtons() {
    console.log("Setting up action buttons...");
    // Garden actions
    const plantCropsButton = document.getElementById('plant-crops');
    if (plantCropsButton) {
        plantCropsButton.addEventListener('click', () => {
            if (money >= 50) {
                money -= 50;
                // Increase crop yield and production rate
                cropYield += 0.2;
                foodProductionRate += 0.5;
                updateUI();
                showMessage("Crops planted! Crop density increased.");
            } else {
                showMessage("Not enough money to plant crops!");
            }
        });
    } else {
        console.warn("Plant Crops button not found.");
    }

    const hireFarmerButton = document.getElementById('hire-farmer');
    if (hireFarmerButton) {
        hireFarmerButton.addEventListener('click', () => {
            if (money >= 100) {
                money -= 100;
                // Increase food production rate
                foodProductionRate += 1;
                updateUI();
                showMessage("Farmer hired! Food production increased.");
            } else {
                showMessage("Not enough money to hire a farmer!");
            }
        });
    } else {
        console.warn("Hire Farmer button not found.");
    }

    const harvestCropsButton = document.getElementById('harvest-crops');
    if (harvestCropsButton) {
        harvestCropsButton.addEventListener('click', () => {
            if (foodProductionRate > 0) { // Simple check if there's potential to harvest
                const foodProduced = foodProductionRate * gardenSize * cropYield; 
                food += foodProduced;
                updateUI();
                showMessage(`Harvested ${foodProduced.toFixed(1)} food from garden!`);
            } else {
                showMessage("Nothing to harvest yet. Plant crops first!");
            }
        });
    } else {
        console.warn("Harvest Crops button not found.");
    }

    // Resident actions
    const addResidentButton = document.getElementById('add-resident');
    if (addResidentButton) {
        addResidentButton.addEventListener('click', () => {
            buyResidentManual();
        });
    } else {
        console.warn("Add Resident button not found.");
    }

    const improveApartmentButton = document.getElementById('improve-apartment');
    if (improveApartmentButton) {
        improveApartmentButton.addEventListener('click', () => {
            if (money >= 200) {
                money -= 200;
                residentSatisfaction = Math.min(100, residentSatisfaction + 10);
                updateUI();
                showMessage("Living conditions improved! Resident satisfaction increased.");
            } else {
                showMessage("Not enough money to improve living conditions!");
            }
        });
    } else {
        console.warn("Improve Apartment button not found.");
    }

    console.log("Action buttons setup complete.");
}

// Update resource consumption display for residents

// Function to perform a rebirth
function rebirth() {
    // Calculate rebirth points based on current progress
    // Formula: (total money earned / 1,000,000) + building level + number of upgrades
    const newPoints = Math.floor(totalMoneyEarned / 1000000) + buildingLevel + (countPurchasedUpgrades() / 5);
    
    // Confirm the rebirth action
    if (money < rebirthRequirement) {
        showMessage(`You need at least ${rebirthRequirement.toLocaleString()} money to rebirth!`, 5000);
        return;
    }
    
    if (!confirm(`Are you sure you want to rebirth? You will lose all your progress but gain ${newPoints} rebirth points!`)) {
        return;
    }
    
    // Add points to total
    rebirthPoints += newPoints;
    totalRebirths++;
    rebirthLevel++;
    
    // Increase requirement for next rebirth
    rebirthRequirement = Math.floor(rebirthRequirement * 2.5);
    
    // Reset all progress
    resetGameProgress();
    
    // Apply rebirth bonuses
    applyRebirthBonuses();
    
    // Update UI
    updateRebirthUI();
    updateUI();
    
    showMessage(`Successfully rebirthed! You gained ${newPoints} rebirth points.`, 5000);
}

// Reset game progress for rebirth
function resetGameProgress() {
    // Reset basic resources
    money = 0;
    moneyPerClick = 1;
    passiveIncomeFromUpgrades = 0;
    buildingLevel = 1;
    waste = 0;
    water = 100;
    energy = 100;
    carbon = 0;
    food = 0;
    efficiency = 40;
    totalMoneyEarned = 0;
    totalClicks = 0;
    
    // Reset building features
    for (const feature in buildingFeatures) {
        buildingFeatures[feature].count = 0;
    }
    
    // Reset population variables
    residents = [];
    maxResidents = 1;
    residentSatisfaction = 100;
    nextResidentId = 1;
    
    // Reset garden variables
    gardenSize = 1;
    cropYield = 1;
    foodProductionRate = 0;
    cropGrowthProgress = 0;

    // Reset quest variables
    activeQuests = [];
    completedQuests = [];
    questProgress = {};

    // Reset unlocked buildings - only keep the main building unlocked
    unlockedBuildings = ['mainBuilding'];
    currentBuilding = 'mainBuilding';
    // Reset building data
    Object.keys(buildingData).forEach(building => {
        if (building === 'mainBuilding') {
            // Reset main building data
            buildingData[building] = {
                level: 1,
                buildingType: 'main', // Keep type consistent
                upgrades: {},
                resources: { energy: 100, water: 100 },
                income: 0,
                unlocked: true, // Main building remains unlocked
                specialFeatures: ['solarPanels', 'rainwaterSystems', 'heatPumps', 'evChargers'] // Reset special features if needed
            };
        } else {
            // Reset all other buildings to locked state
            const originalData = buildingData[building];
            buildingData[building] = {
                level: 0,
                buildingType: originalData?.buildingType || building.replace('Building', '').toLowerCase(), // Keep original type or derive
                upgrades: {},
                resources: { energy: 0, water: 0 },
                income: 0,
                unlocked: false, // Lock the building
                // Reset specific stats for each building type if necessary
                ...(originalData?.buildingType === 'garden' && { foodProduction: 0, cropYield: 1, gardenSize: 1 }),
                ...(originalData?.buildingType === 'waste' && { wasteCapacity: 200, wasteProcessingRate: 1 }),
                specialFeatures: originalData?.specialFeatures || [] // Keep original special features list
            };
        }
    });

    drawBuilding();
    unlockQuestsByBuilding();
}

// Apply bonuses from rebirth points
function applyRebirthBonuses() {
    // Define base values
    const baseMaxWater = 100;
    const baseMaxEnergy = 100;
    const baseMaxFood = 50;
    const baseEfficiency = 40;
    const baseBuildingCosts = {
        communityCenter: 25000,
        gardenBuilding: 15000,
        wasteManagement: 20000
    };

    // Income Boost: 0.3% per point -> Multiplier
    rebirthMultiplier = 1 + (rebirthPoints * 0.003);

    // Resource Cap Boost: 2.5% per point -> Multiplier
    const resourceBoost = 1 + (rebirthPoints * 0.025);
    maxWater = baseMaxWater * resourceBoost;
    maxEnergy = baseMaxEnergy * resourceBoost;
    maxFood = baseMaxFood * resourceBoost;

    // Efficiency Boost: 0.5% per point (additive)
    efficiency = baseEfficiency + (rebirthPoints * 0.5);
    efficiency = Math.min(efficiency, 100);

    // Unlock Cost Reduction: 1% per point (max 80%)
    const unlockDiscount = Math.min(rebirthPoints * 0.01, 0.8);
    Object.keys(baseBuildingCosts).forEach(building => {
        if (!buildingCosts) buildingCosts = {};
        buildingCosts[building] = Math.floor(baseBuildingCosts[building] * (1 - unlockDiscount));
    });

    // Update UI elements
    updateRebirthUI();
}

// Update rebirth UI elements
function updateRebirthUI() {
    updateElement('rebirth-level', rebirthLevel);
    updateElement('rebirth-points', rebirthPoints);
    updateElement('total-rebirths', totalRebirths);
    updateElement('current-money', Math.floor(money).toLocaleString());
    updateElement('rebirth-requirement', rebirthRequirement.toLocaleString());

    // --- Update bonuses based on direct calculation from rebirthPoints ---

    // Income boost display: (Multiplier - 1) * 100
    const incomeBoostPercentage = (rebirthMultiplier - 1) * 100;
    updateElement('income-boost', incomeBoostPercentage.toFixed(1) + '%');

    // Resource boost display: (Multiplier - 1) * 100
    const resourceBoostMultiplier = 1 + (rebirthPoints * 0.025);
    const resourceBoostPercentage = (resourceBoostMultiplier - 1) * 100;
    updateElement('resource-boost', resourceBoostPercentage.toFixed(1) + '%');

    // Efficiency boost display: Direct percentage points added
    const efficiencyBoostPercentage = rebirthPoints * 0.5;
    updateElement('efficiency-boost', efficiencyBoostPercentage.toFixed(1) + '%');

    // Unlock boost display: Direct discount percentage
    const unlockBoostPercentage = Math.min(rebirthPoints * 1, 80); // 1% per point, max 80%
    updateElement('unlock-boost', unlockBoostPercentage.toFixed(0) + '%');

    // Update progress bar
    const progressElement = document.getElementById('rebirth-progress');
    if (progressElement) {
        const progress = Math.min(100, (money / rebirthRequirement) * 100);
        progressElement.style.width = progress + '%';
    }
}

// Get a human-readable display name for a building
function getBuildingDisplayName(buildingId) {
    const displayNames = {
        'mainBuilding': 'Main Building',
        'communityCenter': 'Community Center',
        // 'energyPlant': 'Energy Plant', // Removed
        // 'waterTreatment': 'Water Treatment Facility', // Removed
        'gardenBuilding': 'Garden',
        'wasteManagement': 'Waste Management Facility'
    };
    
    return displayNames[buildingId] || buildingId;
}

// Get a human-readable display name for a room
function getRoomDisplayName(roomId) {
    const displayNames = {
        // Main Building
        'lobby': 'Lobby',
        'apartments': 'Residential Apartments',
        'offices': 'Office Space',
        'communal': 'Communal Area',
        'utility': 'Utility Room',
        
        // Community Center
        'eventHall': 'Event Hall',
        'workshop': 'Workshop',
        'recreation': 'Recreation Area',
        
        
        // Energy Plant
        'controlRoom': 'Control Room',
        'turbineHall': 'Turbine Hall',
        'solarArray': 'Solar Array Control',
        'batteryStorage': 'Battery Storage',
        
        // Water Treatment
        'filteringArea': 'Filtering Area',
        'testingLab': 'Water Testing Lab',
        'storageTanks': 'Storage Tanks',
        
        // Garden
        'nursery': 'Plant Nursery',
        'mainGarden': 'Main Garden',
        'hydroponics': 'Hydroponic System',
        'composter': 'Composting Area',
        
        // Waste Management
        'sortingArea': 'Waste Sorting Area',
        'recyclingCenter': 'Recycling Center',
        'compostFacility': 'Compost Facility',
        'incinerator': 'Clean Incinerator'
    };
    
    return displayNames[roomId] || roomId;
}

// Get a description for a room
function getRoomDescription(roomId) {
    const descriptions = {
        // Main Building
        'lobby': 'The entrance lobby features sustainable materials and energy-efficient lighting.',
        'apartments': 'Residential units with efficient appliances and smart energy management.',
        'offices': 'Modern workspace designed for collaboration and productivity.',
        'communal': 'Shared space for residents to gather and build community.',
        'utility': 'Houses the main systems that keep the building running efficiently.',
        
        // Community Center
        'lobby': 'Welcoming entrance to the community center with information displays.',
        'eventHall': 'Large space for community events and gatherings.',
        'workshop': 'Area equipped for classes and hands-on learning activities.',
        'recreation': 'Space dedicated to leisure activities and fitness.',
        
        
        // Energy Plant
        'controlRoom': 'Monitors and manages all energy systems in the community.',
        'turbineHall': 'Houses the micro-turbines that generate clean electricity.',
        'solarArray': 'Control center for the solar power generation systems.',
        'batteryStorage': 'Energy storage solution for consistent power supply.',
        
        // Water Treatment
        'controlRoom': 'Oversees water purification and distribution systems.',
        'filteringArea': 'Advanced filtering systems remove contaminants from water.',
        'testingLab': 'Ensures water quality meets the highest standards.',
        'storageTanks': 'Safely stores purified water for community use.',
        
        // Garden
        'nursery': 'Where new plants are started and cared for.',
        'mainGarden': 'Primary growing area for fruits and vegetables.',
        'hydroponics': 'Soil-free growing system that uses less water.',
        'composter': 'Converts plant waste into nutrient-rich soil.',
        
        // Waste Management
        'sortingArea': 'Where waste is separated for proper processing.',
        'recyclingCenter': 'Processes recyclable materials for reuse.',
        'compostFacility': 'Converts organic waste into usable compost.',
        'incinerator': 'Clean-burning facility that generates energy from waste.'
    };
    
    return descriptions[roomId] || 'No description available.';
}

// Function to unlock a building
function unlockBuilding(buildingId) {
    console.log(`Attempting to unlock building: ${buildingId}`);
    
    // Check if building ID is valid
    if (!buildingCosts[buildingId]) {
        console.error(`Invalid building ID: ${buildingId}`);
        return;
    }
    
    // Check if enough money
    const cost = buildingCosts[buildingId];
    if (money >= cost) {
        // Deduct cost
        money -= cost;
        
        // Add to unlocked buildings if not already there
        if (!unlockedBuildings.includes(buildingId)) {
            unlockedBuildings.push(buildingId);
        }
        
        // Set building as unlocked in buildingData
        if (buildingData[buildingId]) {
            buildingData[buildingId].unlocked = true;
            buildingData[buildingId].level = 1;
        }
        
        // Switch to the newly unlocked building
        switchBuilding(buildingId);
        
        // Update UI
        updateUI();
        updateBuildingsUI();
        
        // Show success message
        showMessage(`Successfully unlocked ${getBuildingDisplayName(buildingId)}!`, 3000);
        
        // Check quests
        updateQuestProgress('unlockBuilding', 1);
        checkQuestCompletion();
    } else {
        // Not enough money
        showMessage(`Not enough money to unlock this building! Need ${cost.toLocaleString()} money.`, 3000);
    }
}

// Function to switch to a different building
function switchBuilding(buildingId) {
    // Check if building is unlocked
    if (unlockedBuildings.includes(buildingId)) {
        const previousBuilding = currentBuilding;

        // Update current building
        currentBuilding = buildingId;
        drawBuilding();

        // --- Update UI Elements ---
        updateUI();
        updateBuildingsUI();

        // --- Visual Transition ---
        if (previousBuilding !== currentBuilding) {
            // Create a white flash effect
            const flashGeometry = new THREE.PlaneGeometry(100, 100);
            const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0 });
            const flash = new THREE.Mesh(flashGeometry, flashMaterial);
            // Position slightly in front of the camera's current view
            const distance = 5;
            const position = new THREE.Vector3();
            camera.getWorldDirection(position);
            position.multiplyScalar(distance);
            position.add(camera.position);
            flash.position.copy(position);
            flash.lookAt(camera.position);

            scene.add(flash);
        } else {
            // Just redraw if it's the same building (e.g., after an upgrade)
            drawBuilding();
        }

        showMessage(`Switched to ${getBuildingDisplayName(buildingId)}`, 2000);
    } else {
        showMessage(`You need to unlock ${getBuildingDisplayName(buildingId)} first!`, 3000);
    }
}

// Store calculated totals from the last game tick, initialized to 0
let lastCalculatedTotals = {
    waterConsumption: 0,
    energyConsumption: 0,
    foodConsumption: 0,
    wasteProduction: 0,
    foodProduction: 0,
    energyProduction: 0,
    waterProduction: 0,
    wasteProcessing: 0,
    jobIncome: 0,
    jobSatisfactionBoost: 0,
    baseIncome: 0
};

// Function to update the passive income (called every second)
function updatePassiveIncome() {    
    // --- Use Cumulative Job Effects ---
    // Job income and satisfaction boost are now calculated via apply/removeJobEffects
    lastCalculatedTotals.jobIncome = cumulativeJobEffects.incomeBonus;
    lastCalculatedTotals.jobSatisfactionBoost = cumulativeJobEffects.satisfactionBonus;

    // --- Calculate Base Passive Income (from building level) ---
    let basePassiveIncome = buildingLevel * 0.1; // Reduced base income per level

    // Apply efficiency bonus (base efficiency + job bonus)
    let currentEfficiency = efficiency + cumulativeJobEffects.efficiencyBonus;
    currentEfficiency = Math.max(0, Math.min(100, currentEfficiency));
    let efficiencyMultiplier = currentEfficiency / 100;
    basePassiveIncome *= efficiencyMultiplier;

    // Apply satisfaction modifier (similar to previous logic, maybe adjust threshold/min)
    const SATISFACTION_PENALTY_THRESHOLD = 50; // Example threshold
    const SATISFACTION_PENALTY_MIN_MULTIPLIER = 0.3; // Example min multiplier
    let satisfactionMultiplier = 1.0;
    if (residentSatisfaction < SATISFACTION_PENALTY_THRESHOLD) {
         satisfactionMultiplier = SATISFACTION_PENALTY_MIN_MULTIPLIER +
            ((residentSatisfaction / SATISFACTION_PENALTY_THRESHOLD) * (1.0 - SATISFACTION_PENALTY_MIN_MULTIPLIER));
         satisfactionMultiplier = Math.max(SATISFACTION_PENALTY_MIN_MULTIPLIER, satisfactionMultiplier);
         satisfactionMultiplier = Math.min(1.0, satisfactionMultiplier);
    }
    basePassiveIncome *= satisfactionMultiplier;

    // Store the calculated base income from upgrades for potential display/debugging
    lastCalculatedTotals.baseIncome = basePassiveIncome;

    // --- Total income for this tick (Base Passive Income + Job Income + Upgrade Income) ---
    // Add job income directly to passiveIncomeFromUpgrades
    passiveIncomeFromUpgrades += cumulativeJobEffects.incomeBonus;
    const totalIncomeThisTick = basePassiveIncome + passiveIncomeFromUpgrades;

    // Apply satisfaction boost from jobs (capped at 100)
    residentSatisfaction = Math.min(100, residentSatisfaction + cumulativeJobEffects.satisfactionBonus);

    // --- Food Production ---
    let baseFoodProduction = 0; // Placeholder - This should come from garden logic if separate
    // Add job bonus
    let totalFoodProduction = baseFoodProduction + cumulativeJobEffects.foodProductionBonus;
    lastCalculatedTotals.foodProduction = totalFoodProduction;
    food = Math.min(maxFood, food + totalFoodProduction);

    // Efficiency multiplier is already calculated above

    // Calculate rebirth multiplier if it exists
    const rebirthMultiplier = rebirthBonuses && rebirthBonuses.incomeBoost 
        ? 1 + (rebirthBonuses.incomeBoost / 100) 
        : 1;
    
    // Calculate final income for this tick including rebirth multiplier
    const finalIncomeThisTick = totalIncomeThisTick * rebirthMultiplier;
    money += finalIncomeThisTick;
    totalMoneyEarned += finalIncomeThisTick;

    // Add energy generation from solar panels
    const solarGenerationRate = 0.5; // Energy per panel per tick (adjust as needed)
    const generatedEnergy = buildingFeatures.solarPanels.count * solarGenerationRate;
    energy = Math.min(maxEnergy, energy + generatedEnergy);

    // Handle rain and rainwater collection
    if (isRaining && buildingFeatures.rainwaterSystems.count > 0) {
        const waterCollectionRate = 0.2; // Water per system per tick (adjust as needed)
        const collectedWater = buildingFeatures.rainwaterSystems.count * waterCollectionRate;
        water = Math.min(maxWater, water + collectedWater);
    }

    // Add water from pumps
    if (buildingFeatures.waterPumps && buildingFeatures.waterPumps.count > 0) {
        const waterPumpRate = 0.3; // Water per pump per tick (adjust as needed)
        const pumpedWater = buildingFeatures.waterPumps.count * waterPumpRate;
        water = Math.min(maxWater, water + pumpedWater);
    }

    // Add food from garden upgrades
    let foodGenerationRate = 0;
    if (buildingFeatures.hydroponics && buildingFeatures.hydroponics.count > 0) {
        foodGenerationRate += buildingFeatures.hydroponics.count * 0.2;
    }
    if (buildingFeatures.compostSystem && buildingFeatures.compostSystem.count > 0) {
        foodGenerationRate += buildingFeatures.compostSystem.count * 0.1;
    }
     if (buildingFeatures.permaculture && buildingFeatures.permaculture.count > 0) {
        foodGenerationRate += buildingFeatures.permaculture.count * 0.15;
    }
    // Add base food production from garden building itself?
    if (currentBuilding === 'gardenBuilding' && buildingData.gardenBuilding.unlocked) {
         foodGenerationRate += buildingData.gardenBuilding.level * 0.5;
    }
    food = Math.min(maxFood, food + foodGenerationRate);

    // Simple random chance for rain to start/stop each tick
    if (Math.random() < 0.005) { // Low chance to change weather state
        isRaining = !isRaining;
        // Optional: showMessage(`It started ${isRaining ? 'raining' : 'to clear up'}!`);
    }

    if (isRaining && buildingFeatures.rainwaterSystems.count > 0) {
        const waterCollectionRate = 0.2; // Water per system per tick (adjust as needed)
        const collectedWater = buildingFeatures.rainwaterSystems.count * waterCollectionRate;
        water = Math.min(maxWater, water + collectedWater);
    const energyDeficit = lastCalculatedTotals.energyConsumption > lastCalculatedTotals.energyProduction;
    const waterDeficit = lastCalculatedTotals.waterConsumption > lastCalculatedTotals.waterProduction;
    const foodDeficit = lastCalculatedTotals.foodConsumption > lastCalculatedTotals.foodProduction;
    const wasteOverflow = lastCalculatedTotals.wasteProduction > lastCalculatedTotals.wasteProcessing;

    if (energy < maxEnergy * 0.1 && energyDeficit) addStatusEffect('lowEnergy', 'Low Energy', 'Energy levels critical!', 'debuff');
    else removeStatusEffect('lowEnergy');

    if (water < maxWater * 0.1 && waterDeficit) addStatusEffect('lowWater', 'Low Water', 'Water reserves depleted!', 'debuff');
    else removeStatusEffect('lowWater');

    if (food < maxFood * 0.1 && foodDeficit) addStatusEffect('lowFood', 'Low Food', 'Food supply critical!', 'debuff');
    else removeStatusEffect('lowFood');

    if (waste >= maxWaste * 0.9 && wasteOverflow) addStatusEffect('highWaste', 'High Waste', 'Waste approaching capacity!', 'debuff');
    else removeStatusEffect('highWaste');

    if (residentSatisfaction < 30) addStatusEffect('lowSatisfaction', 'Low Satisfaction', 'Residents are unhappy!', 'debuff');
    else removeStatusEffect('lowSatisfaction');

    // Example temporary buff for high satisfaction
    if (residentSatisfaction > 95 && !activeStatusEffects.find(e => e.id === 'highSatisfaction')) {
        addStatusEffect('highSatisfaction', 'High Satisfaction', 'Residents are thriving!', 'buff', 5000);
    }

    // Weather effects
    if (Math.random() < 0.005) {
        isRaining = !isRaining;
        if (isRaining) addStatusEffect('raining', 'Raining', 'Rain helps water collection.', 'buff');
        else removeStatusEffect('raining');
    }
    }
    
    // Reduce resources based on building level
    reduceResources();
    
    // Update carbon based on efficiency
    const carbonGain = efficiency / 20;
    carbon += carbonGain;
    
    // Update the UI to reflect the new values
    updateUI();
    
    // If energy or water are depleted, show warning
    // Add water from pumps
    if (buildingFeatures.waterPumps && buildingFeatures.waterPumps.count > 0) {
        const waterPumpRate = 0.3; // Water per pump per tick (adjust as needed)
        const pumpedWater = buildingFeatures.waterPumps.count * waterPumpRate;
        water = Math.min(maxWater, water + pumpedWater);
    }
// Removed duplicate food generation logic block
    }
    // Add base food production from garden building itself?
    if (currentBuilding === 'gardenBuilding' && buildingData.gardenBuilding.unlocked) {
         foodGenerationRate += buildingData.gardenBuilding.level * 0.5;
    }
    // food update logic moved into gameTick function


    if (energy <= 0 || water <= 0) {
        const message = energy <= 0 ? "Energy depleted! Income reduced by 50%" : "Water depleted! Garden production reduced by 30%";
        showMessage(message, 'warning');
    }

// Helper function to reduce resources based on building level
function reduceResources() {
    let totalWaterConsumption = 0;
    let totalEnergyConsumption = 0;
    let totalFoodConsumption = 0;
    let totalWasteProduction = 0;

    // Calculate total base consumption/production from all residents
    totalWaterConsumption = residents.length * baseWaterConsumptionPerResident;
    totalEnergyConsumption = residents.length * baseEnergyConsumptionPerResident;
    totalFoodConsumption = residents.length * baseFoodConsumptionPerResident;
    totalWasteProduction = residents.length * baseWasteProductionPerResident;

    // Apply multiplicative job modifiers
    totalWaterConsumption *= jobEffectTotals.waterConsumptionModifier;
    totalEnergyConsumption *= jobEffectTotals.energyConsumptionModifier;
    totalWasteProduction *= jobEffectTotals.wasteProductionModifier;
    // Apply food consumption modifier if added later

    // Store calculated totals before applying efficiency etc.
    lastCalculatedTotals.waterConsumption = totalWaterConsumption;
    lastCalculatedTotals.energyConsumption = totalEnergyConsumption;
    lastCalculatedTotals.foodConsumption = totalFoodConsumption;
    lastCalculatedTotals.wasteProduction = totalWasteProduction;

    // Add base consumption from buildings
    let buildingWaterConsumption = buildingData.mainBuilding.level * 0.125 + (buildingData.gardenBuilding.unlocked ? buildingData.gardenBuilding.level * 0.25 : 0);
    let buildingEnergyConsumption = buildingData.mainBuilding.level * 0.25;
    // Add other building consumptions if necessary

    totalWaterConsumption += buildingWaterConsumption;
    totalEnergyConsumption += buildingEnergyConsumption; // Add building consumption BEFORE applying efficiency factor

    // Apply building efficiency factor to the combined energy consumption
    let currentEfficiency = efficiency + cumulativeJobEffects.efficiencyBonus;
    currentEfficiency = Math.max(0, Math.min(100, currentEfficiency));
    let efficiencyFactor = 1 - (currentEfficiency / 100);
    totalEnergyConsumption *= efficiencyFactor;

    // Apply final consumption/production
    water = Math.max(0, water - totalWaterConsumption);
    energy = Math.max(0, energy - totalEnergyConsumption);
    food = Math.max(0, food - totalFoodConsumption);
    waste = Math.min(maxWaste, waste + totalWasteProduction);

    // Basic resource depletion effects on satisfaction (Reduced penalties)
    if (water === 0) residentSatisfaction = Math.max(0, residentSatisfaction - 0.1); // Reduced from 0.5
    if (energy === 0) residentSatisfaction = Math.max(0, residentSatisfaction - 0.1); // Reduced from 0.5
    if (food === 0) residentSatisfaction = Math.max(0, residentSatisfaction - 0.2); // Reduced from 1.0
    if (waste > maxWaste) residentSatisfaction = Math.max(0, residentSatisfaction - 0.05); // Reduced from 0.2

    // Natural satisfaction decay (slow)
    residentSatisfaction = Math.max(0, residentSatisfaction - 0.05);
}

// Function to show a message to the user
function showMessage(text, type = 'info', duration = 3000) {
    const messageElement = document.getElementById('message');
    if (!messageElement) return;
    
    // Clear any existing timeout
    if (window.messageTimeout) {
        clearTimeout(window.messageTimeout);
    }
    
    // Set message text and make it visible
    messageElement.textContent = text;
    messageElement.className = 'visible';
    
    // Add message type class
    messageElement.classList.add(type);
    
    // Set a timeout to hide the message
    window.messageTimeout = setTimeout(() => {
        messageElement.className = '';
    }, duration);
}

// Function to create floating text animation (for click feedback)
function createFloatingText(x, y, text, color = '#27ae60') {
    // Create the floating text element
    const textElement = document.createElement('div');
    textElement.className = 'floating-text';
    textElement.textContent = text;
    textElement.style.color = color;
    textElement.style.left = x + 'px';
    textElement.style.top = y + 'px';
    
    // Add to the document
    document.body.appendChild(textElement);
    
    // Animate the floating text
    setTimeout(() => {
        textElement.style.transform = 'translateY(-60px)';
        textElement.style.opacity = '0';
    }, 10);
    
    // Remove the element after animation completes
    setTimeout(() => {
        document.body.removeChild(textElement);
    }, 1000);
}

// --- Resident Management Functions ---

// Function to add a new resident
function addResident() {
    if (residents.length < maxResidents) {
        const newResident = {
            id: nextResidentId++,
            job: 'unemployed', // Start unemployed
            satisfaction: 100, // Initial satisfaction
            skills: { // Add basic skills
                farming: Math.random() * 10,
                technical: Math.random() * 10,
                management: Math.random() * 10
            },
            visual: null // Placeholder for the THREE.Mesh object
        };
        residents.push(newResident);
        console.log(`Added resident ${newResident.id}. Total: ${residents.length}`);
        updateManagementTab();
        updateUI();
        return true;
    }
    return false;
}

function checkResidentSpawn() {
    // Example condition: High satisfaction and available housing
    // Spawn the first resident if needed, otherwise check for spawning additional ones
    if (residents.length === 0) {
        addResident();
    } else if (residentSatisfaction > 80 && residents.length < maxResidents && Math.random() < 0.01) { // Low chance per frame for more
       addResident();
    }
}

// --- End Resident Management Functions ---

// --- UI Tab Update Functions ---

function updatePopulationTab() {
    updateElement('residents', `${residents.length} / ${maxResidents}`);
    updateElement('max-residents', maxResidents);
    updateElement('satisfaction', `${residentSatisfaction.toFixed(1)}%`);

    const satisfactionFill = document.getElementById('satisfaction-bar-fill');
    if (satisfactionFill) {
        satisfactionFill.style.width = `${residentSatisfaction}%`;
    }

    // Display the base consumption/production rates per resident
    updateElement('avg-resident-energy', `${baseEnergyConsumptionPerResident.toFixed(2)}`);
    updateElement('avg-resident-water', `${baseWaterConsumptionPerResident.toFixed(2)}`);
    updateElement('avg-resident-food', `${baseFoodConsumptionPerResident.toFixed(2)}`);
    updateElement('avg-resident-waste', `${baseWasteProductionPerResident.toFixed(2)}`);

    // Update income from rent display (base rent only)
    updateElement('resident-income', (residents.length * residentialRent).toFixed(2));
}


// New function to update the Management Tab
function updateManagementTab() {
    const residentListContainer = document.getElementById('resident-list');
    if (!residentListContainer) return;

    residentListContainer.innerHTML = '';

    if (residents.length === 0) {
        residentListContainer.innerHTML = '<p>No residents yet. Attract them by improving satisfaction and housing!</p>';
        return;
    }

    residents.forEach(resident => {
        const card = document.createElement('div');
        card.classList.add('resident-card');
        card.setAttribute('data-resident-id', resident.id);

        let skillsHTML = '<ul class="resident-skills-list">';
        for (const skill in resident.skills) {
            skillsHTML += `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${resident.skills[skill].toFixed(1)}</li>`;
        }
        skillsHTML += '</ul>';

        let jobOptionsHTML = `<select class="job-select" data-resident-id="${resident.id}">`;
        for (const jobId in jobs) {
            const job = jobs[jobId];
            const buildingRequired = job.building;
            // Check if building exists in buildingData and is unlocked, OR if it's the main building (always unlocked)
            const isUnlocked = !buildingRequired || buildingRequired === 'mainBuilding' || (buildingData[buildingRequired] && buildingData[buildingRequired].unlocked);
            const selected = resident.job === jobId ? 'selected' : '';
            const disabled = !isUnlocked ? 'disabled' : '';
            const suffix = !isUnlocked ? ` (Requires ${getBuildingDisplayName(buildingRequired)})` : '';
            jobOptionsHTML += `<option value="${jobId}" ${selected} ${disabled}>${job.displayName}${suffix}</option>`;
        }
        jobOptionsHTML += `</select>`;

        card.innerHTML = `
            <h4>Resident #${resident.id}</h4>
            <p>Job: <span class="resident-job-display">${jobs[resident.job]?.displayName || 'Unemployed'}</span></p> <!-- Add span with class -->
            <p>Satisfaction: ${residentSatisfaction.toFixed(1)}%</p> <!-- Use global satisfaction -->
            <p>Skills:</p>
            ${skillsHTML} <!-- Skills list already has class -->
            <div class="job-assignment">
                <label for="job-select-${resident.id}">Assign Job:</label> ${jobOptionsHTML.replace('<select', `<select id="job-select-${resident.id}"`)}
                <button class="assign-job-button action-button" data-resident-id="${resident.id}">Assign</button>
            </div>
        `;
        residentListContainer.appendChild(card);
    });
    // Update manual purchase button costs
    const residentBtn = document.getElementById('buy-resident-btn');
    if (residentBtn) {
        residentBtn.textContent = `Recruit Resident ($${getManualResidentCost()})`;
        residentBtn.disabled = money < getManualResidentCost() || residents.length >= maxResidents;
    }
    const energyBtn = document.getElementById('buy-max-energy-btn');
    if (energyBtn) {
        energyBtn.textContent = `Increase Max Energy (+25) ($${getManualMaxEnergyCost()})`;
        energyBtn.disabled = money < getManualMaxEnergyCost();
    }
    const waterBtn = document.getElementById('buy-max-water-btn');
    if (waterBtn) {
        waterBtn.textContent = `Increase Max Water (+25) ($${getManualMaxWaterCost()})`;
        waterBtn.disabled = money < getManualMaxWaterCost();
    }
}

// Function to assign a job to a resident
function assignJob(residentId, jobId) {
    const resident = residents.find(r => r.id === residentId);
    const job = jobs[jobId];

    if (!resident || !job) {
        showMessage("Invalid resident or job.", 'error');
        return;
    }

    // Check if required building is unlocked
    const buildingRequired = job.building;
    if (buildingRequired && buildingRequired !== 'mainBuilding' && (!buildingData[buildingRequired] || !buildingData[buildingRequired].unlocked)) { // Add check for mainBuilding
        showMessage(`Cannot assign job: ${getBuildingDisplayName(buildingRequired)} is not unlocked.`, 'error');
        return;
    }

    const previousJobId = resident.job;
    removeJobEffects(resident, previousJobId);

    // Assign the new job
    resident.job = jobId;

    // Apply effects of the new job
    applyJobEffects(resident); // Placeholder for effect application logic

    showMessage(`Resident #${residentId} assigned as ${job.displayName}.`);

    // Update only the specific resident's card UI instead of the whole tab
    updateResidentCardUI(residentId);
}

// --- Manual Purchase Functions ---

// Cost Calculators
function getManualResidentCost() {
    // Example: Base cost 100, increases by 50 for each existing resident
    return 100 + (residents.length * 50);
}

function getManualMaxEnergyCost() {
    // Example: Base cost 50, increases by 1 for each point of max capacity
    return 50 + (maxEnergy * 1);
}

function getManualMaxWaterCost() {
    // Example: Base cost 50, increases by 1 for each point of max capacity
    return 50 + (maxWater * 1);
}

// Purchase Handlers
function buyResidentManual() {
    const cost = getManualResidentCost();
    if (money >= cost && residents.length < maxResidents) {
        money -= cost;
        addResident();
        updateUI(); 
        if(isTabVisible('management-tab')) updateManagementTab(); 
        showMessage("New resident recruited!");
    } else if (residents.length >= maxResidents) {
        showMessage("Cannot recruit more residents. Max capacity reached.", 'warning');
    } else {
        showMessage("Not enough money to recruit a resident.", 'warning');
    }
    updateManagementButtonsState();
}

function buyMaxEnergy() {
    const cost = getManualMaxEnergyCost();
    if (money >= cost) {
        money -= cost;
        maxEnergy += 25;
        updateUI(); 
        showMessage("Max energy increased!");
    } else {
        showMessage("Not enough money to increase max energy.", 'warning');
    }
    updateManagementButtonsState(); 
}

function buyMaxWater() {
    const cost = getManualMaxWaterCost();
    if (money >= cost) {
        money -= cost;
        maxWater += 25;
        updateUI(); 
        showMessage("Max water increased!");
    } else {
        showMessage("Not enough money to increase max water.", 'warning');
    }
    updateManagementButtonsState();
}



function handleAssignJobClick(event) {
    // Check if the clicked element is an assign button
    if (event.target.classList.contains('assign-job-button')) {
        const button = event.target;
        const residentId = parseInt(button.dataset.residentId, 10);
        // Find the corresponding select element
        const selectElement = document.getElementById(`job-select-${residentId}`);
        if (selectElement) {
            const selectedJobId = selectElement.value;
            assignJob(residentId, selectedJobId);
        } else {
            console.error("Could not find select element for resident:", residentId);
        }
    }
}