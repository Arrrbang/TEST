let currencySymbol = ""; // 화폐 단위를 저장할 변수
let dataNonDiplomat = {};
let dataDiplomat = {};
let containerTypes = [];
let basicExtraCost = {};
let heavyItemData = {};

const dropdown = document.getElementById("cbm-dropdown");
const containerDropdown = document.getElementById("container-dropdown");
const result = document.getElementById("basic-delivery-value");
const nonDiplomat = document.getElementById("non-diplomat");
const diplomat = document.getElementById("diplomat");
const stairCbmDropdown = document.getElementById("staircbm");
const stairFloorDropdown = document.getElementById("stairfloor");
const stairChargeResult = document.getElementById("stair-charge");
const heavyItemDropdown = document.getElementById("heavyitemunit");
const heavyItemValue = document.getElementById("heavyitem-value");
const storageperiodDropdown = document.getElementById("storageperiod");
const storageValue = document.getElementById("storage-value");
const totalCostElement = document.getElementById("total-value");
const poeDropdown = document.getElementById("poe-dropdown");
const link1Element = document.getElementById("link1");
const link2Element = document.getElementById("link2");
const notionBackendURL = 'https://notion-backend-liard.vercel.app/notion';
const ofcValueElement = document.getElementById('ofcvalue');

// resetDropdown 함수 변경
function resetDropdown(dropdownElement, placeholder = "-- CBM 선택 --") {
  if (!dropdownElement) {
    return; // 잘못된 호출 무시
  }
  dropdownElement.innerHTML = `<option value="">${placeholder}</option>`;
}

// 링크 초기화
function initializeLinks() {
  link1Element.textContent = "Default Link 1";
  link1Element.onclick = () => console.log("Default Link 1 clicked");
  link1Element.style.pointerEvents = "none";
  link1Element.style.color = "gray";

  link2Element.textContent = "Default Link 2";
  link2Element.onclick = () => console.log("Default Link 2 clicked");
  link2Element.style.pointerEvents = "none";
  link2Element.style.color = "gray";
}

// 링크 업데이트
function updateLinks(links) {

  if (!Array.isArray(links) || links.length < 2) {
    initializeLinks();
    return;
  }

   // 링크 1 업데이트
  if (links[0]?.url) {
    link1Element.textContent = links[0].label || "Default Link 1";
    link1Element.style.pointerEvents = "auto";
    link1Element.style.color = "white";
    link1Element.onclick = () => {
      window.open(links[0].url, "_blank");
    };
  } else {
    link1Element.textContent = "Default Link 1";
    link1Element.style.pointerEvents = "none";
    link1Element.style.color = "gray";
  }

  // 링크 2 업데이트
  if (links[1]?.url) {
    link2Element.textContent = links[1].label || "Default Link 2";
    link2Element.style.pointerEvents = "auto";
    link2Element.style.color = "white";
    link2Element.onclick = () => {
      window.open(links[1].url, "_blank");
    };
  } else {
    link2Element.textContent = "Default Link 2";
    link2Element.style.pointerEvents = "none";
    link2Element.style.color = "gray";
  }
}



async function initializePoeDropdown(path) {
  try {
    const poeDropdownPath = `${path}/poedropdown.json`;

    const response = await fetch(poeDropdownPath);

    if (!response.ok) {
      return;
    }

    const poeOptions = await response.json();

    if (!Array.isArray(poeOptions)) {
      throw new TypeError("POE dropdown data is not an array. Check JSON format.");
    }

    resetDropdown(poeDropdown, "-- POE 선택 --");

    poeOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option.value;
      opt.textContent = option.label;
      poeDropdown.appendChild(opt);
    });

    poeDropdown.addEventListener("change", handlePoeChange);
    } catch {
  }
}

function handlePoeChange() {
  const poeValue = poeDropdown.value;

  if (poeValue) {
    fetchData().then(() => {
      // 기본값 설정 후 업데이트 호출
  updateAllDiplomatSensitiveResults(); // 추가 비용 업데이트
        const stairDescription = basicExtraCost["STAIR CHARGE"]?.description || "";
      const stairDescriptionElement = document.getElementById("stair-description");
      if (stairDescriptionElement) {
        stairDescriptionElement.textContent = stairDescription; // 설명 업데이트
      }
    });
  } else {
  }
}

async function fetchData() {
  try {
    const params = new URLSearchParams(window.location.search);
    const path = params.get("path");
    if (!path) {
      console.error("Path parameter missing for fetchData");
      return;
    }

    const poeValue = poeDropdown.value;
    if (!poeValue) {
      return;
    }


    const basePath = "https://arrrbang.github.io/frontend";
    const tableJsonPath = `${basePath}/${path}/poeis${poeValue}_tariff.json`;
    const modifiedPath = path.replace(/\/[^/]+\/?$/, "");
    const extraCostJsonPath = `${basePath}/${modifiedPath}/poeis${poeValue}_extracost.json`;

    // JSON 데이터 가져오기
    const [tableResponse, extraCostResponse] = await Promise.all([
      fetch(tableJsonPath),
      fetch(extraCostJsonPath),
    ]);

    if (!tableResponse.ok || !extraCostResponse.ok) {
      return;
    }

    // JSON 데이터 파싱
    const tableData = await tableResponse.json();
    const extraCostData = await extraCostResponse.json();

    // 화폐 단위 저장
    currencySymbol = extraCostData["화폐단위"] || "";

    // "DATA BASE"의 description 값 가져오기
    const dataBaseDescription = extraCostData["DATA BASE"]?.description || ""; // 기본값 설정
    const dataDescriptionElement = document.getElementById("data-description");
    if (dataDescriptionElement) {
      dataDescriptionElement.textContent = dataBaseDescription;  // description을 업데이트
    }

    // 링크 업데이트
    if (Array.isArray(tableData.links) && tableData.links.length > 0) {
      updateLinks(tableData.links);
    } else if (Array.isArray(extraCostData.links) && extraCostData.links.length > 0) {
      updateLinks(extraCostData.links);
    } else {
      initializeLinks(); // 기본 링크 초기화
    }

    // 데이터 업데이트
    basicExtraCost = extraCostData;
    dataNonDiplomat = tableData.nonDiplomat || {};
    dataDiplomat = tableData.diplomat || {};
    containerTypes = tableData.containerType || [];

    // 기타 드롭다운 및 값 업데이트
    const currentCbmValue = parseInt(dropdown?.value, 10) || null;  // 1부터 60까지의 값을 사용
    const currentContainerValue = containerDropdown?.value || null;

    // CBM 드롭다운 및 기타 드롭다운 업데이트
    if (dropdown) {
      updateCbmDropdown(dropdown, currentCbmValue);
    }
    if (containerDropdown) {
      updateContainerDropdown(containerTypes, containerDropdown, currentContainerValue);
    }
    updateStairChargeDropdown();
    updateHeavyItemDropdown();
    updatestorageperiodDropdown();
    calculateTotalCost();
    
    const stairDescription = basicExtraCost["STAIR CHARGE"]?.description || "";
    const stairDescriptionElement = document.getElementById("stair-description");
    if (stairDescriptionElement) {
      stairDescriptionElement.textContent = stairDescription; // 설명 업데이트
    }
    updateHeavyItemDropdown(); // HEAVY ITEM 드롭다운 업데이트
  } catch (error) {
  }
}


// DOMContentLoaded 이벤트 리스너
document.addEventListener("DOMContentLoaded", async () => {
  initializeLinks();

  const params = new URLSearchParams(window.location.search);
  const path = params.get("path");

  if (path) {
    await initializePoeDropdown(path);
    fetchData().then(() => {
      updateAllDiplomatSensitiveResults(); // 추가 비용 업데이트
      updateHeavyItemDropdown(); // HEAVY ITEM 드롭다운 업데이트
    });
  } else {
    console.error("Path parameter missing in URL.");
  }

    poeDropdown.addEventListener("change", () => {
    const poeValue = poeDropdown.value;
    if (poeValue) {
      fetchData(); // POE 변경 시 데이터를 다시 불러옵니다.
    }
  });

  // 체크박스 동작 상호 배제
    nonDiplomat.addEventListener("change", () => {
      if (nonDiplomat.checked) {
        diplomat.checked = false; // diplomat 체크 해제
      }
      updateBasicDeliveryCost(); // 기본 배송 비용 업데이트
      updateAllCosts(); // 모든 비용 업데이트
    });
    
    diplomat.addEventListener("change", () => {
      if (diplomat.checked) {
        nonDiplomat.checked = false; // nonDiplomat 체크 해제
      }
      updateBasicDeliveryCost(); // 기본 배송 비용 업데이트
      updateAllCosts(); // 모든 비용 업데이트
    });
});


function resetDropdown(dropdownElement, placeholder = "-- CBM 선택2 --") {
  if (!dropdownElement) {
    return; // 잘못된 호출 무시
  }
  dropdownElement.innerHTML = `<option value="">${placeholder}</option>`;
}

// CBM 드롭다운 업데이트
function updateCbmDropdown(dropdownElement, selectedValue) {
  resetDropdown(dropdownElement, "-- CBM 선택 --");

  // 1부터 60까지의 숫자 추가
  for (let i = 1; i <= 60; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = i;
    dropdownElement.appendChild(option);
  }

  // 기존 선택 값 복원
  if (selectedValue && selectedValue >= 1 && selectedValue <= 60) {
    dropdownElement.value = selectedValue;
  } else {
    dropdownElement.value = ""; // 기본값
  }

  dropdownElement.dispatchEvent(new Event("change"));
}

// 컨테이너 타입 드롭다운 업데이트
function updateContainerDropdown(containerTypes, containerDropdown, selectedValue) {
  resetDropdown(containerDropdown, "-- CONTANIER TYPE 선택 --");
  containerTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    containerDropdown.appendChild(option);
  });

  // 기존 선택 값 복원
  if (selectedValue && containerTypes.includes(selectedValue)) {
    containerDropdown.value = selectedValue;
  } else {
    containerDropdown.value = ""; // 선택값 초기화
  }
}
//------------------OFC비용 가져오기---------------------------
// POE 또는 Container 드롭다운 값 변경 시 데이터 업데이트
async function updateOfcValue() {
  const poeValue = poeDropdown.value; // POE 값
  const containerType = containerDropdown.value; // Container Type 값

  // POE 또는 Container Type이 선택되지 않았다면 기본값 표시
  if (!poeValue || !containerType) {
    ofcValueElement.textContent = "값 없음";
    return;
  }

  try {
    // 백엔드 호출
    const response = await fetch(notionBackendURL);
    if (!response.ok) {
      throw new Error(`백엔드 호출 실패: ${response.status}`);
    }

    const notionData = await response.json();

    // 노션 데이터에서 POE와 컨테이너 타입에 맞는 값 찾기
    const matchingData = notionData.data.find(
      (item) => item.name === poeValue // POE 이름 매칭
    );

    // 해당 데이터가 없거나 컨테이너 타입이 일치하지 않으면 기본값 표시
    if (!matchingData || !matchingData[`value${containerType}`]) {
      ofcValueElement.textContent = "값 없음";
      return;
    }

    // 값 업데이트
    const value = matchingData[`value${containerType}`];
    ofcValueElement.textContent = value !== null ? value.toLocaleString() : "값 없음"; // 숫자 형식화
  } catch (error) {
    console.error('Error fetching OFC value:', error);
    ofcValueElement.textContent = "오류 발생";
  }
}

// 드롭다운 변경 시 데이터 업데이트
poeDropdown.addEventListener('change', updateOfcValue);
containerDropdown.addEventListener('change', updateOfcValue);

// 초기화 시 OFC 값 업데이트
document.addEventListener('DOMContentLoaded', updateOfcValue);

//------------------basic delivery 처리------------------------
function updateBasicDeliveryCost() {
  const selectedCBM = parseInt(dropdown.value, 10); // 선택된 CBM 값
  const isNonDiplomat = nonDiplomat.checked; // Non-Diplomat 여부
  const isDiplomat = diplomat.checked; // Diplomat 여부
  const selectedContainer = containerDropdown.value; // 선택된 컨테이너 타입

  // 유효성 검사: CBM 값과 체크박스 상태 확인
  if (isNaN(selectedCBM) || selectedCBM < 1 || selectedCBM > 60) {
    result.textContent = "None";
    return;
  }

  if (!isNonDiplomat && !isDiplomat) {
    result.textContent = "None"; // 기본값
    return;
  }

  // NonDiplomat 또는 Diplomat 데이터 선택
  const dataCategory = isNonDiplomat ? dataNonDiplomat : dataDiplomat;
  let costValue = "None"; // 기본값 설정

  if (typeof dataCategory[selectedContainer] === "object") {
    // 컨테이너 타입이 있는 경우
    const containerData = dataCategory[selectedContainer];
    
    // CBM 값에 해당하는 범위 또는 개별 값 찾기
    const rangeKey = Object.keys(containerData).find(key => {
      if (key.includes("-")) {
        const [start, end] = key.split("-").map(Number);
        return selectedCBM >= start && selectedCBM <= end;
      }
      return selectedCBM == key;
    });

    // 범위 또는 개별값에 해당하는 비용 가져오기
    costValue = rangeKey ? containerData[rangeKey] : containerData["ANY"];
  } else {
    // 컨테이너 타입이 없는 경우
    const cbmData = dataCategory;

    // CBM 값에 해당하는 범위 또는 개별 값 찾기
    const rangeKey = Object.keys(cbmData).find(key => {
      if (key.includes("-")) {
        const [start, end] = key.split("-").map(Number);
        return selectedCBM >= start && selectedCBM <= end;
      }
      return selectedCBM == key;
    });

    // 범위 또는 개별값에 해당하는 비용 가져오기
    costValue = rangeKey ? cbmData[rangeKey] : "None";
  }

  // 값이 숫자인 경우 화폐 단위를 추가
  if (!isNaN(costValue)) {
    costValue = `${currencySymbol}${parseFloat(costValue).toLocaleString()}`; // 화폐 단위 추가 및 형식화
  }

  // 결과 업데이트
  result.textContent = costValue;
}

// CBM 드롭다운 값 변경 시 기본 배송 비용 업데이트
dropdown.addEventListener("change", updateBasicDeliveryCost);

// 외교 화물 체크박스 변경 시 기본 배송 비용 업데이트
nonDiplomat.addEventListener("change", updateBasicDeliveryCost);
diplomat.addEventListener("change", updateBasicDeliveryCost);

// 컨테이너 드롭다운 값 변경 시 기본 배송 비용 업데이트
containerDropdown.addEventListener("change", updateBasicDeliveryCost);
    
//--------------------basic cost 처리---------------------------
function updateDiplomatSensitiveResult(categoryKey) {
  const selectedContainer = containerDropdown.value; // 선택된 컨테이너 타입
  const selectedCBM = parseInt(dropdown.value, 10); // 선택된 CBM 값 (숫자로 변환)
  let result = "None"; // 초기 값 설정

  const categoryData = basicExtraCost[categoryKey];

  if (!categoryData) {
    return;
  }

  // NonDiplomat 또는 Diplomat 구분
  const role = nonDiplomat.checked ? "NonDiplomat" : "Diplomat";
  
  // 해당 컨테이너 타입의 데이터 가져오기
  const costData = categoryData[role]?.[selectedContainer];

  // 1. "단가"가 있는지 확인
  if (typeof costData === "object" && costData["단가"]) {
    const unitCost = parseFloat(costData["단가"]);
    result = (selectedCBM * unitCost).toFixed(2); // CBM 값과 곱하기
  } 
  // 2. "단가"가 없고, CBM 범위가 있는지 확인
  else if (typeof costData === "object") {
    // 범위 처리: "1-30", "31-60" 같은 범위 체크
    const rangeKey = Object.keys(costData).find((key) => {
      if (key.includes("-")) {
        const [start, end] = key.split("-").map(Number);
        return selectedCBM >= start && selectedCBM <= end;
      }
      return false;
    });
    // 범위에 맞는 값을 출력
    result = costData[rangeKey] || "None";
  } 
  // 3. "단가" 항목도 없고, 값 그대로 출력
  else if (typeof costData === "number") {
    result = costData; // 값 그대로 출력
  } 
  // 4. "단가" 항목도 없고, 문자 그대로 출력
  else if (typeof costData === "string") {
    result = costData; // 문자 그대로 출력
  }

  // 5. 기본값이 없을 경우 단위 비용 처리
  if (result === "None" && !isNaN(selectedCBM)) {
    const defaultMultiplier = categoryData[role]?.unitMultiplier || 0;
    result = selectedCBM * defaultMultiplier;
  }

  // 6. 화폐 단위 추가
  if (!isNaN(result) && result !== "None") {
    result = `${currencySymbol}${parseFloat(result).toLocaleString()}`; // 화폐 단위와 숫자 형식화
  }

  // 7. 업데이트
  const labelElement = document.getElementById(`${categoryKey}-label`);
  const valueElement = document.getElementById(`${categoryKey}-value`);
  const descriptionElement = document.getElementById(`${categoryKey}-description`);

  if (labelElement) labelElement.textContent = categoryData.name || "NONE";
  if (valueElement) valueElement.textContent = result;
  if (descriptionElement) descriptionElement.textContent = categoryData.description || "";
}



//------------------------------basic cost total 계산------------------------------
// total-value 계산 함수
function calculateTotalCost() {
  let totalCost = 0;

  // 'basic-cost-'로 시작하는 모든 값을 가져오기
  const costValueElements = document.querySelectorAll('[id^="basic-cost-"][id$="-value"]');

  costValueElements.forEach(costValueElement => {
    const costValueText = costValueElement.textContent || "None";

    // 화폐 단위 및 숫자만 추출
    const costValue = parseFloat(costValueText.replace(/[\$€₩]/g, "").replace(/[^0-9.-]+/g, ""));
    if (!isNaN(costValue)) {
      totalCost += costValue;
    }
  });

  // basic-delivery-value 값도 추가
  const basicDeliveryValueElement = document.getElementById("basic-delivery-value");
  const basicDeliveryValueText = basicDeliveryValueElement ? basicDeliveryValueElement.textContent : "None";

  const basicDeliveryValue = parseFloat(basicDeliveryValueText.replace(/[\$€₩]/g, "").replace(/[^0-9.-]+/g, ""));
  if (!isNaN(basicDeliveryValue)) {
    totalCost += basicDeliveryValue;
  }

  // 결과 출력: 화폐 단위를 포함한 형식
  totalCostElement.textContent = `${currencySymbol || ""}${totalCost.toLocaleString()}`;
}

// MutationObserver 설정
function observeCostChanges() {
  // 기본 배송비와 추가 비용의 변화를 감지할 observer 설정
  const config = { childList: true, subtree: true };

  // basic-cost-?와 basic-delivery-value를 관찰
  const observedElements = [
    ...document.querySelectorAll('[id^="basic-cost-"][id$="-value"]'),
    document.getElementById("basic-delivery-value")
  ];

  observedElements.forEach(element => {
    if (element) {
      const observer = new MutationObserver(calculateTotalCost);
      observer.observe(element, config);
    }
  });
}

// DOMContentLoaded 시 호출
document.addEventListener("DOMContentLoaded", () => {
  calculateTotalCost(); // 초기 계산
  observeCostChanges(); // MutationObserver 활성화
});

//-------------------extra cost 계산-------------------------
function updateExtraCostResult(categoryKey) {
  const selectedContainer = containerDropdown.value; // 선택된 컨테이너 타입
  const selectedCBM = parseInt(dropdown.value, 10); // 선택된 CBM 값 (숫자로 변환)
  let result = "None"; // 초기 값 설정

  const categoryData = basicExtraCost[categoryKey];

  if (!categoryData) {
    return;
  }

  // 해당 컨테이너 타입의 데이터 가져오기
  const costData = categoryData[selectedContainer];

  // 1. "단가"가 있는지 확인
  if (typeof costData === "object" && costData["단가"]) {
    const unitCost = parseFloat(costData["단가"]);
    result = (selectedCBM * unitCost).toFixed(2); // CBM 값과 곱하기
  }
  // 2. "단가"가 없고, CBM 범위가 있는지 확인
  else if (typeof costData === "object") {
    // 범위 처리: "1-30", "31-60" 같은 범위 체크
    const rangeKey = Object.keys(costData).find((key) => {
      if (key.includes("-")) {
        const [start, end] = key.split("-").map(Number);
        return selectedCBM >= start && selectedCBM <= end;
      }
      return false;
    });
    // 범위에 맞는 값을 출력
    result = costData[rangeKey] || "None";
  } 
  // 3. "단가" 항목이 없고, 값 그대로 출력
  else if (typeof costData === "number") {
    result = costData; // 값 그대로 출력
  } 
  // 4. "단가" 항목도 없고, 문자 그대로 출력
  else if (typeof costData === "string") {
    result = costData; // 문자 그대로 출력
  }

  // 5. 기본값이 없을 경우 단위 비용 처리
  if (result === "None" && !isNaN(selectedCBM)) {
    const defaultMultiplier = categoryData?.unitMultiplier || 0;
    result = selectedCBM * defaultMultiplier;
  }

  // 6. 화폐 단위 추가
  if (!isNaN(result) && result !== "None") {
    result = `${currencySymbol}${parseFloat(result).toLocaleString()}`; // 화폐 단위와 숫자 형식화
  }

  // 7. 업데이트
  const labelElement = document.getElementById(`${categoryKey}-label`);
  const valueElement = document.getElementById(`${categoryKey}-value`);
  const descriptionElement = document.getElementById(`${categoryKey}-description`);

  if (labelElement) labelElement.textContent = categoryData.name || "NONE";
  if (valueElement) valueElement.textContent = result;
  if (descriptionElement) descriptionElement.textContent = categoryData.description || "";

}


//-------------------stair carry charge 업데이트---------------
// POE 드롭다운 선택 시 설명 업데이트 및 계단 비용 계산
poeDropdown.addEventListener("change", () => {
  // POE 드롭다운이 선택된 후에 바로 description 업데이트
  const stairDescription = basicExtraCost["STAIR CHARGE"]?.description || "";
  const stairDescriptionElement = document.getElementById("stair-description");
  if (stairDescriptionElement) {
    stairDescriptionElement.textContent = stairDescription;
  }

  // POE 선택 후 계단 비용 계산도 바로 실행
  calculateStairCharge();
});

// 이동 CBM 드롭다운 업데이트
function updateStairChargeDropdown() {
  resetDropdown(stairCbmDropdown, "이동 CBM 선택");

  const selectedCBM = parseInt(dropdown.value, 10); // 상위 CBM 선택값
  if (!isNaN(selectedCBM) && selectedCBM > 0) {
    // STAIR CBM 옵션 추가 (1 ~ selectedCBM 범위)
    for (let i = 1; i <= selectedCBM; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      stairCbmDropdown.appendChild(option);
    }
  } else {
    // 선택된 CBM이 유효하지 않은 경우 추가 옵션을 비웁니다.
    resetDropdown(stairCbmDropdown, "이동 CBM 선택");
  }

  // STAIR FLOOR 옵션 추가 (2 ~ 10 고정)
  resetDropdown(stairFloorDropdown, "이동 층 선택");
  for (let i = 2; i <= 10; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}층`;
    stairFloorDropdown.appendChild(option);
  }
}

// ▼STAIR CHARGE 결과 계산
function calculateStairCharge() {
  const cbmValue = parseInt(stairCbmDropdown.value, 10);
  const floorValue = parseInt(stairFloorDropdown.value, 10);

  // JSON에서 "CBM단가" 값을 가져오기
  const cbmUnitCost = basicExtraCost["STAIR CHARGE"]?.["CBM단가"] || 0; // 기본값은 0

  // description 업데이트
  const stairDescription = basicExtraCost["STAIR CHARGE"]?.description || "";
  const stairDescriptionElement = document.getElementById("stair-description");
  if (stairDescriptionElement) {
    stairDescriptionElement.textContent = stairDescription; // description 업데이트
  }

  if (!isNaN(cbmValue) && !isNaN(floorValue)) {
    const stairCharge = cbmValue * (floorValue - 1) * cbmUnitCost; // floor-1로 계산
    stairChargeResult.textContent = `${currencySymbol}${stairCharge.toFixed(2)}`; // 소수점 2자리까지 표시
  } else {
    stairChargeResult.textContent = "None"; // 기본값
  }
}


//--------------------------------heavy items-----------------------------
function updateHeavyItemDropdown() {
  const heavyItemData = basicExtraCost["HEAVY ITEM"]; // JSON 데이터에서 HEAVY ITEM 가져오기

  if (!heavyItemData) {
    return;
  }

  // 1. heavyitem-description 업데이트
  const descriptionElement = document.getElementById("heavyitem-description");
  if (descriptionElement) {
    descriptionElement.textContent = heavyItemData.description || "";
  }

  // 2. heavyitemunit 드롭다운 옵션 생성
  resetDropdown(heavyItemDropdown, "중량 화물 단위 선택");

  const unit = heavyItemData["단위"] || ""; // 단위 가져오기
  for (let i = 1; i <= 5; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}${unit}`; // 숫자 뒤에 단위 추가
    heavyItemDropdown.appendChild(option);
  }

  // 3. 드롭다운 변경 시 값 계산
  heavyItemDropdown.addEventListener("change", () => {
    const selectedValue = parseInt(heavyItemDropdown.value, 10); // 선택된 숫자 값
    const unitCost = heavyItemData["단가"] || 0; // 단가 가져오기

    // 값 계산
    const calculatedValue = !isNaN(selectedValue) ? `${currencySymbol}${(selectedValue * unitCost).toLocaleString()}` : "None";

    // heavyitem-value 업데이트
    const valueElement = document.getElementById("heavyitem-value");
    if (valueElement) {
      valueElement.textContent = calculatedValue !== "None" ? calculatedValue.toLocaleString() : "None";
    }
  });
}
//----------------------storage charge 계산-----------------
function updatestorageperiodDropdown() {
  const storageData = basicExtraCost["STORAGE CHARGE"]; // JSON에서 STORAGE CHARGE 가져오기

  if (!storageData) {
    return;
  }

  // 1. 무료 보관 기간과 보관 비용 단가 설정
  const freeStorageDays = parseInt(storageData["무료 보관 기간 일자"], 10) || 0; // 기본값은 0
  const storageUnitCost = parseFloat(storageData["보관 비용 단가"]) || 0; // 기본 보관 단가

  if (isNaN(freeStorageDays) || isNaN(storageUnitCost)) {
    return;
  }

  // 2. storageperiod 드롭다운 옵션 생성 (무료 보관 일수 이후부터 시작)
  resetDropdown(storageperiodDropdown, "보관 기간 선택");

  for (let i = freeStorageDays + 1; i <= freeStorageDays + 90; i++) { // 무료 보관 이후부터 90일까지 옵션 생성
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i}일`;
    storageperiodDropdown.appendChild(option);
  }

  // 3. 설명 업데이트
  const descriptionElement = document.getElementById("storage-description");
  if (descriptionElement) {
    descriptionElement.textContent = storageData.description || "";
  }

  // 4. 드롭다운 변경 시 값 계산
  storageperiodDropdown.addEventListener("change", () => {
    const selectedDays = parseInt(storageperiodDropdown.value, 10); // 선택된 보관 기간
    const selectedCBM = parseInt(dropdown.value, 10); // 선택된 CBM 값

    if (!isNaN(selectedDays) && !isNaN(selectedCBM)) {
      // 선택된 일수에서 무료 보관 일수를 제외
      const chargeableDays = selectedDays - freeStorageDays;

      // 비용 계산: (유료 보관 일수 * 단가 * CBM)
      const calculatedValue = chargeableDays * storageUnitCost * selectedCBM;
      const formattedValue = `${currencySymbol}${calculatedValue.toLocaleString()}`; // 형식화된 결과

      // id="storage-value" 업데이트
      const valueElement = document.getElementById("storage-value");
      if (valueElement) {
        valueElement.textContent = formattedValue;
      }
    } else {
      // 선택되지 않은 경우 기본값
      const valueElement = document.getElementById("storage-value");
      if (valueElement) {
        valueElement.textContent = "None";
      }
    }
  });
}


//--------------------------------------------------------------------------------

    
// DOMContentLoaded 후에 호출
document.addEventListener("DOMContentLoaded", () => {
  updateStairChargeDropdown(); // 페이지 로드 후 초기화
  calculateStairCharge(); // 초기값 계산
  calculateTotalCost();
});
    

// 모든 카테고리를 동적으로 업데이트
function updateAllCosts() {
  // basic 비용 업데이트
  Object.keys(basicExtraCost).forEach((categoryKey) => {
    if (categoryKey.startsWith("basic-cost-")) {
      updateDiplomatSensitiveResult(categoryKey);
    }
  });

  // Extra 비용 업데이트
  Object.keys(basicExtraCost).forEach((categoryKey) => {
    if (categoryKey.startsWith("extra-cost-")) {
      updateExtraCostResult(categoryKey);
    }
  });
}

// JSON 데이터 로드 후 호출
fetchData().then(() => {
  updateBasicDeliveryCost(); // 기본 배송 비용 업데이트
  updateAllDiplomatSensitiveResults(); // 추가 비용 업데이트
  updateHeavyItemDropdown(); // HEAVY ITEM 드롭다운 업데이트
  updatestorageperiodDropdown(); // STORAGE CHARGE 드롭다운 업데이트
});


poeDropdown.addEventListener("change", updateAllCosts);
dropdown.addEventListener("change", updateAllCosts);
containerDropdown.addEventListener("change", updateAllCosts);
nonDiplomat.addEventListener("change", updateAllCosts);
diplomat.addEventListener("change", updateAllCosts);

stairCbmDropdown.addEventListener("change", calculateStairCharge);
stairFloorDropdown.addEventListener("change", calculateStairCharge);
dropdown.addEventListener("change", updateStairChargeDropdown);
