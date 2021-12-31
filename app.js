//Get the current price of bitcoin
const priceh3 = document.querySelector('#price_now');
const priceRequestURL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur';
const priceRequest = new XMLHttpRequest();
priceRequest.open('GET', priceRequestURL);
priceRequest.responseType = 'json';

priceRequest.onload = function () {
    const price = priceRequest.response;
    updatePrice(price);
}
priceRequest.send();
//Updating the price to the page
function updatePrice(obj) {
    priceh3.innerText = 'Price now: ' + new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(obj['bitcoin']['eur']);
}
//Variables for page elements
const startForm = document.querySelector('#start_date');
const endForm = document.querySelector('#end_date');
const analyzeButton = document.querySelector('#analyzeButton');
const resetButton = document.querySelector('#resetButton');
const bitcoinH2 = document.querySelector('#bitcoinh2');
//Element which will be removed when user changes the date range
let divToRemove;

//Calls all the other functions
const analyzeMarketData = async () => {
    try {
        const allMarketData = await getMarketData();
        const firstHoursPriceData = firstHours(allMarketData['prices']);
        const firstHoursVolumeData = firstHours(allMarketData['total_volumes']);
        const longestBearishTrend = longestBearish(firstHoursPriceData);
        const highestTradingVolume = tradingVolume(firstHoursVolumeData);
        const profitFromBitcoin = profitBitcoin(firstHoursPriceData);
        showBitcoinData(longestBearishTrend, highestTradingVolume, profitFromBitcoin);

        //Change button states
        resetButton.disabled = false;
        analyzeButton.disabled = true;
    } catch (e) {
        console.error("Error analyzing the market data!");
    }
}

//Gets the market data from the API
const getMarketData = async () => {
    try {
        const startDate = startForm.elements.start_date_input.value;
        const endDate = endForm.elements.end_date_input.value;
        //Checking if the forms are empty
        if (startDate === '' || endDate === '') {
            alert('Please, fill in the date range!');
            return;
        }
        //Date to unix time stamp
        const unixStartDate = Math.floor(new Date(startDate) / 1000);
        const unixEndDate = Math.floor(new Date(endDate) / 1000) + 3600;  //+1 hour, 3600s

        const res = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=eur&from=' + unixStartDate + '%20&to=' + unixEndDate);
        return res.data;
    } catch (e) {
        console.error("Error when loading market data!");
    }
}

//Gets the market data as a parameter and saves each days first after UTC 00:00 data to a new array
function firstHours(obj) {
    try {
        let firstHoursData = [];
        let startingDate = new Date(obj[0][0]);
        //Goes through the data set and picks the first data of each day
        for (let i = 0; i < obj.length; i++) {
            if (new Date(obj[i][0]).getUTCDate() === new Date(startingDate).getUTCDate()) {
                firstHoursData.push(obj[i]);
                startingDate.setUTCDate(startingDate.getUTCDate() + 1);
            }
        }
        console.log('Bitcoin market data from 00:00 UTC:');
        console.log(firstHoursData);
        return firstHoursData;
    } catch (e) {
        console.error("Error when gathering data from 00:00 UTC!");
    }
}

//Searches for the longest bearish trend within the market data
function longestBearish(obj) {
    let counter = 0;
    let longestStreak = 0;
    //Checks if the price on the next day is less than on the current i day
    for (let i = 0; i < obj.length; i++) {
        if (i < obj.length - 1) {
            if (obj[i][1] > obj[i + 1][1]) {
                counter++;
            }
        }
        //Update longest streak if needed
        if (counter > longestStreak) {
            longestStreak = counter;
        }
        //Set counter back to 0 if i+1 day has equal or higher price
        if (i < obj.length - 1) {
            if (obj[i][1] <= obj[i + 1][1]) {
                counter = 0;
            }
        }
    }
    console.log('Longest bearish trend was ' + longestStreak + ' day(s)');
    return longestStreak;
}

//Finds the date with the highest trading volume
function tradingVolume(obj) {
    let result = obj[0];
    let highestVolume = obj[0][1];
    //Checks for the highest volume and returns an array containing the date and volume
    for (let i = 1; i < obj.length; i++) {
        if (obj[i][1] > highestVolume) {
            highestVolume = obj[i][1];
            result = obj[i];
        }
    }
    console.log('The date with the highest trading volume was: ' + new Date(result[0]) + ' and the volume was: ' + result[1] + '€');
    return result;
}

//For the time machine, return an array with boolean should the user buy within this time period, 
//date for buiyng, date for selling and possible profit
function profitBitcoin(obj) {
    let shouldBuy;
    let profit = 0;
    let buyDate = obj[0];
    let sellDate = obj[1];
    //Starts from i=0 date and compares the price difference to th rest of the days.
    //Then moves to the i=1 and so on to find the biggest profit 
    for (let i = 0; i < obj.length; i++) {
        for (let j = i + 1; j < obj.length; j++) {
            if (obj[j][1] - obj[i][1] > profit) {
                profit = obj[j][1] - obj[i][1];
                buyDate = obj[i];
                sellDate = obj[j];
            }
        }
    }
    if (profit <= 0) {
        console.log('You should neither buy nor sell');
        shouldBuy = false;
    } else {
        console.log('You should buy: ' + new Date(buyDate[0]) + ' and sell: ' + new Date(sellDate[0]) + '. The profit is: ' + profit + '€');
        shouldBuy = true;
    }
    return [shouldBuy, buyDate, sellDate, profit];
}

//Creating the div to the web page containing analyzed market data
function showBitcoinData(bearish, volume, profit) {
    //Main div
    const dataDiv = document.createElement('div');
    divToRemove = dataDiv;
    dataDiv.classList.add('container-sm', 'p-5');
    document.body.appendChild(dataDiv);
    //Overview h2
    const h2results = document.createElement('h2');
    h2results.innerText = 'Overview of the date range';
    h2results.classList.add('text-center', 'fw-normal', 'mx-auto')
    dataDiv.append(h2results);
    //Big div
    const bigDiv = document.createElement('div');
    bigDiv.classList.add('row', 'justify-content-center', 'pt-4')
    dataDiv.append(bigDiv);

    //Smaller divs
    //Column 1
    const div1 = document.createElement('div');
    div1.classList.add('col');
    const h1Icon1 = document.createElement('h1');
    h1Icon1.classList.add('text-center', 'fw-normal');
    const icon1 = document.createElement('i');
    icon1.classList.add('bi', 'bi-arrow-down-right');
    h1Icon1.append(icon1);
    div1.append(h1Icon1);
    //Topic
    const h3bearish = document.createElement('h3');
    h3bearish.innerText = 'Longest bearish trend';
    h3bearish.classList.add('text-center', 'fw-normal');
    div1.append(h3bearish);
    //Longest streak
    const h4streak = document.createElement('h4');
    h4streak.innerText = bearish + ' day(s) in a row';
    h4streak.classList.add('text-center', 'fw-normal', 'blacktext');
    div1.append(h4streak);
    bigDiv.append(div1);

    //Column 2
    const div2 = document.createElement('div');
    div2.classList.add('col')
    const h1Icon2 = document.createElement('h1');
    h1Icon2.classList.add('text-center', 'fw-normal');
    const icon2 = document.createElement('i');
    icon2.classList.add('bi', 'bi-arrow-left-right');
    h1Icon2.append(icon2);
    div2.append(h1Icon2);
    //Topic
    const h3volume = document.createElement('h3');
    h3volume.innerText = 'Highest trading volume';
    h3volume.classList.add('text-center', 'fw-normal');
    div2.append(h3volume);
    //Highest volume
    const h4volumeDate = document.createElement('h4');
    h4volumeDate.innerText = new Date(volume[0]).getUTCDate() + '.' + (new Date(volume[0]).getUTCMonth() + 1) + '.' + new Date(volume[0]).getUTCFullYear();
    h4volumeDate.classList.add('text-center', 'fw-normal', 'blacktext');
    div2.append(h4volumeDate);
    const h4volumeEuros = document.createElement('h4');
    h4volumeEuros.innerText = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(volume[1]);
    h4volumeEuros.classList.add('text-center', 'fw-normal', 'blacktext');
    div2.append(h4volumeEuros);
    bigDiv.append(div2);

    //Column 3
    const div3 = document.createElement('div');
    div3.classList.add('col')
    const h1Icon3 = document.createElement('h1');
    h1Icon3.classList.add('text-center', 'fw-normal');
    const icon3 = document.createElement('i');
    icon3.classList.add('bi', 'bi-currency-euro');
    h1Icon3.append(icon3);
    div3.append(h1Icon3);
    //Topic
    const h3timeMachine = document.createElement('h3');
    h3timeMachine.innerText = 'Bitcoin time machine';
    h3timeMachine.classList.add('text-center', 'fw-normal');
    div3.append(h3timeMachine);
    //Should buy or not
    if (profit[0] === false) {
        const h4noProfit = document.createElement('h4');
        h4noProfit.innerText = 'Should neither buy nor sell';
        h4noProfit.classList.add('text-center', 'fw-normal', 'blacktext');
        div3.append(h4noProfit);
    } else {
        //Buy
        const h4buy = document.createElement('h4');
        h4buy.innerText = 'Day to buy: ' + new Date(profit[1][0]).getUTCDate() + '.' + (new Date(profit[1][0]).getUTCMonth() + 1) + '.' + new Date(profit[1][0]).getUTCFullYear();
        h4buy.classList.add('text-center', 'fw-normal', 'blacktext');
        div3.append(h4buy);
        //Sell
        const h4sell = document.createElement('h4');
        h4sell.innerText = 'Day to sell: ' + new Date(profit[2][0]).getUTCDate() + '.' + (new Date(profit[2][0]).getUTCMonth() + 1) + '.' + new Date(profit[2][0]).getUTCFullYear();
        h4sell.classList.add('text-center', 'fw-normal', 'blacktext');
        div3.append(h4sell);
        //Profit
        const h4profit = document.createElement('h4');
        h4profit.innerText = 'Profit: ' + new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(profit[3]);
        h4profit.classList.add('text-center', 'fw-normal', 'blacktext');
        div3.append(h4profit);
    }
    bigDiv.append(div3);
}

//Resets the date input forms, changes the states of the buttons and removes the div containing the previous date range overview
function reset() {
    startForm.reset();
    endForm.reset();
    divToRemove.remove();
    analyzeButton.disabled = false;
    resetButton.disabled = true;
}

//Buttons
analyzeButton.addEventListener('click', analyzeMarketData)
resetButton.addEventListener('click', reset);

