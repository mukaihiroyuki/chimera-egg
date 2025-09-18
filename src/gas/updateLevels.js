// --- CONFIGURATION ---
const SPREADSHEET_ID = '1tiULGVsagDyL-OTEaWv0znPN-3fM3TX6Yi-p50jsGus';
const EQUIPMENT_SHEET_NAME = '全機材・車両リスト';
const LOG_SHEET_NAME = '点検・修理ログ';
// --- END OF CONFIGURATION ---

/**
 * A trigger function that runs when the spreadsheet is edited.
 * This function handles maintenance logs and updates equipment stats.
 * @param {Object} e The event object.
 */
function handleMaintenance(e) {
  // Check if the event object is valid.
  if (!e || !e.range) {
    Logger.log('This function must be run by an installable trigger.');
    return;
  }

  try {
    const sheet = e.range.getSheet();
    const editedRow = e.range.getRow();
    
    // Exit if the edit is not on the LOG_SHEET.
    if (sheet.getName() !== LOG_SHEET_NAME) {
      return;
    }

    // --- Get Edited Data ---
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const machineIdColIndex = headers.indexOf('machine_id');
    const workContentColIndex = headers.indexOf('作業内容'); // ★日本語の列名に対応！

    if (machineIdColIndex === -1 || workContentColIndex === -1) {
      Logger.log('Required columns ("machine_id", "作業内容") not found in the log sheet.');
      return;
    }
    
    const machineId = sheet.getRange(editedRow, machineIdColIndex + 1).getValue();
    const workContent = sheet.getRange(editedRow, workContentColIndex + 1).getValue();

    // Exit if essential data is missing.
    if (!machineId || !workContent) {
      return;
    }

    Logger.log(`Maintenance detected for machine_id: ${machineId}, Work: ${workContent}`);

    // --- Calculate XP based on work content ---
    let xpGained = 0;
    // ★日本語の作業内容でXPを計算！
    switch (workContent) {
      case "給油":
      case "洗車":
      case "空気圧チェック":
      case "ランプチェック":
        xpGained = 10; // デイリーケア
        break;
      case "日常点検":
      case "作動油チェック":
      case "グリスアップ":
      case "フィルター交換":
        xpGained = 30; // ウィークリーケア
        break;
      case "オイル交換":
      case "バッテリー交換":
        xpGained = 50; // ウィークリーケア＋
        break;
      case "修理":
      case "部品交換":
      case "車検":
      case "オーバーホール":
        xpGained = 100; // スペシャルケア
        break;
      default:
        xpGained = 5; // その他
        break;
    }

    if (xpGained === 0) {
      Logger.log('No XP gained for this action.');
      return;
    }

    // --- Update Equipment Sheet ---
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const equipmentSheet = ss.getSheetByName(EQUIPMENT_SHEET_NAME);
    if (!equipmentSheet) {
      Logger.log(`Sheet "${EQUIPMENT_SHEET_NAME}" not found.`);
      return;
    }
    
    const equipmentAllData = equipmentSheet.getDataRange().getValues();
    const eqHeaders = equipmentAllData[0];
    const eqIdCol = eqHeaders.indexOf('machine_id');
    const levelCol = eqHeaders.indexOf('level');
    const xpCol = eqHeaders.indexOf('xp');
    const healthCol = eqHeaders.indexOf('health');
    const lastCaredDateCol = eqHeaders.indexOf('last_cared_date');

    // Find the correct row for the machine ID
    for (let i = 1; i < equipmentAllData.length; i++) { // Start from 1 to skip header
      if (equipmentAllData[i][eqIdCol] === machineId) {
        const sheetRow = i + 1;
        let currentLevel = Number(equipmentAllData[i][levelCol]) || 1;
        let currentXp = Number(equipmentAllData[i][xpCol]) || 0;

        currentXp += xpGained;

        const xpForNextLevel = 100 + (currentLevel * 10);

        while (currentXp >= xpForNextLevel) {
          currentLevel++;
          currentXp -= xpForNextLevel;
        }

        // Update the sheet
        equipmentSheet.getRange(sheetRow, levelCol + 1).setValue(currentLevel);
        equipmentSheet.getRange(sheetRow, xpCol + 1).setValue(currentXp);
        equipmentSheet.getRange(sheetRow, healthCol + 1).setValue(100); // Reset health to 100
        equipmentSheet.getRange(sheetRow, lastCaredDateCol + 1).setValue(new Date()); // Update last cared date

        Logger.log(`Successfully updated stats for ${machineId}. New Level: ${currentLevel}, New XP: ${currentXp}, Health: 100`);
        return; // Exit after updating
      }
    }

    Logger.log(`Machine ID "${machineId}" not found in the equipment list.`);

  } catch (error) {
    Logger.log(`Error in handleMaintenance: ${error.message} Stack: ${error.stack}`);
  }
}

/**
 * A one-time function to initialize the health of all equipment to 100.
 */
function initializeHealth() {
  Logger.log('initializeHealth: 開始');
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const equipmentSheet = ss.getSheetByName(EQUIPMENT_SHEET_NAME);
    if (!equipmentSheet) {
      throw new Error(`Sheet "全機材・車両リスト" not found.`);
    }

    const lastRow = equipmentSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log('initializeHealth: データがありません。終了。');
      return;
    }
    Logger.log(`initializeHealth: ${lastRow - 1}行のデータを処理します。`);

    const eqHeaders = equipmentSheet.getRange(1, 1, 1, equipmentSheet.getLastColumn()).getValues()[0];
    const healthCol = eqHeaders.indexOf('health');

    if (healthCol === -1) {
      throw new Error('Required column ("health") not found.');
    }

    const healthColumnRange = equipmentSheet.getRange(2, healthCol + 1, lastRow - 1, 1);
    const healthData = healthColumnRange.getValues();
    Logger.log('initializeHealth: health列のデータを読み込みました。');

    let changesMade = false;
    for (let i = 0; i < healthData.length; i++) {
      if (healthData[i][0] === '') { // If health is blank
        healthData[i][0] = 100;
        changesMade = true;
      }
    }

    if (changesMade) {
      Logger.log('initializeHealth: health列への書き込みを開始します...');
      healthColumnRange.setValues(healthData);
      Logger.log('initializeHealth: health列への書き込みが完了しました。');
    } else {
      Logger.log('initializeHealth: 空欄のhealthは見つかりませんでした。');
    }

  } catch (error) {
    Logger.log(`★★★ Error in initializeHealth: ${error.message} Stack: ${error.stack}`);
  }
  Logger.log('initializeHealth: 終了');
}


/**
 * A time-driven function to decrease health for neglected equipment.
 * Runs automatically on a schedule (e.g., daily).
 */
function decreaseHealthOverTime() {
  const NEGLECT_THRESHOLD_DAYS = 7; // 7日以上放置されたらhealth減少
  const HEALTH_DECREASE_AMOUNT = 10; // healthの減少量

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const equipmentSheet = ss.getSheetByName(EQUIPMENT_SHEET_NAME);
    if (!equipmentSheet) {
      Logger.log(`Sheet "${EQUIPMENT_SHEET_NAME}" not found.`);
      return;
    }
    
    const equipmentData = equipmentSheet.getDataRange().getValues(); // データはここで一括取得
    const eqHeaders = equipmentData[0];

    const healthCol = eqHeaders.indexOf('health');
    const lastCaredDateCol = eqHeaders.indexOf('last_cared_date');

    if (healthCol === -1 || lastCaredDateCol === -1) {
      Logger.log('Required columns ("health", "last_cared_date") not found.');
      return;
    }

    const now = new Date();

    // ★★★ 呪いを解いた最終バージョン ★★★
    // 変更があった行だけを、安全なsetValueで個別に更新する！
    for (let i = 1; i < equipmentData.length; i++) { // ヘッダーを飛ばすため i=1 から
      const sheetRow = i + 1;
      const lastCaredDate = new Date(equipmentData[i][lastCaredDateCol]);
      let currentHealth = Number(equipmentData[i][healthCol]);

      if (currentHealth === 0 || !lastCaredDate.getTime()) {
        continue;
      }

      const diffTime = now.getTime() - lastCaredDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays > NEGLECT_THRESHOLD_DAYS) {
        const newHealth = Math.max(0, currentHealth - HEALTH_DECREASE_AMOUNT);
        if (newHealth !== currentHealth) {
          // 変更があったセルだけをピンポイントで更新！これが呪いを解く鍵！
          equipmentSheet.getRange(sheetRow, healthCol + 1).setValue(newHealth);
          Logger.log(`Health for row ${sheetRow} decreased to ${newHealth}.`);
        }
      }
    }
    Logger.log('Health check complete.');

  } catch (error) {
    Logger.log(`Error in decreaseHealthOverTime: ${error.message} Stack: ${error.stack}`);
  }
}