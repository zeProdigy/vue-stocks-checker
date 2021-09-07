function MoexISS() {
}

MoexISS.spec = async function (secid) {
    let url = makeUrl(null, null, null, null, secid, null);
    let res = await request(url);

    let spec = {
        description: {},
        mainboard: {},
    };

    res.description.data.forEach(item => {
        spec.description[item[0]] = item[2];
    });

    res.boards.columns.map((key, index) => {
        spec.mainboard[key] = res.boards.data[0][index];
    });

    return spec;
}

MoexISS.info = async function (spec) {
    let url = makeUrl(null,
                      spec.engine,
                      spec.market,
                      spec.boardid,
                      spec.secid,
                      null);
    let res = await request(url);

    let info = {};

    Object.keys(res).forEach(key => {
        info[key] = {};
        res[key].columns.map((name, index) => {
            if (res[key].data.length) {
                info[key][name] = res[key].data[0][index];
            }
        });
    });

    return info;
}

MoexISS.dividends = async function (spec) {
    let url = makeUrl(null,
                      null,
                      null,
                      null,
                      spec.secid,
                      "dividends");
    let res = await request(url);

    if (res.dividends.data.length === 0) {
        return {};
    }

    let divs = {
        currency: res.dividends.data[0][4],
        data: [],
    };

    res.dividends.data.forEach(item => {
        divs.data.push([item[2], item[3]]);
    });

    return divs;
}

MoexISS.coupons = async function (spec) {
    let url = makeUrl("statistics",
                      spec.engine,
                      spec.market,
                      null,
                      null,
                      `bondization/${spec.secid}`);
    let res = await request(url);

    let payout = {
        amortizations: [],
        coupons: [],
    };

    for (let data of res.amortizations.data) {
        let obj = {};
        res.amortizations.columns.map((key, index) => {
            obj[key] = data[index];
        });
        payout.amortizations.push(obj);
    }

    for (let data of res.coupons.data) {
        let obj = {};
        res.coupons.columns.map((key, index) => {
            obj[key] = data[index];
        });
        payout.coupons.push(obj);
    }

    return payout;
}

// http://iss.moex.com/iss/history/engines/stock/markets/shares/boards/TQBR/securities/LKOH.json?iss.meta=on&from=2020-06-1&till=2020-12-30&start=100
MoexISS.history = async function (spec, from, till,
    columns=["TRADEDATE", "CLOSE", "VOLUME", "VALUE"]) {
    let url = makeUrl("history",
                      spec.engine,
                      spec.market,
                      spec.boardid,
                      spec.secid,
                      null);

    let start = 0;
    let indexes = {};
    let history = {};

    columns.forEach(item => {
        history[item] = [];
    });

    while(true) {
        let query = makeQuery({
            from: `${from}`,
            till: `${till}`,
            start: start,
        });

        let res = await request(url, query);

        if (res.history.data.length === 0) {
            break;
        }

        if (Object.keys(indexes).length === 0) {
            res.history.columns.forEach((item, index) => {
                indexes[item] = index;
            });
        }

        res.history.data.forEach(item => {
            columns.forEach(colName => {
                history[colName].push(item[indexes[colName]]);
            });
        });

        start += 100;
    }

    return history;
}

// https://iss.moex.com/iss/statistics/engines/stock/markets/bonds/bondization?from=2020-02-01&till=2020-02-20&start=0&limit=100&iss.only=amortizations,coupons
function makeUrl(opening, engine, market, board, security, ending) {
    let url = 'https://iss.moex.com/iss';

    if (opening) {
        url += `/${opening}`;
    }

    if (engine) {
        url += `/engines/${engine}`;
    }

    if (market) {
        url += `/markets/${market}`;
    }

    if (board) {
        url += `/boards/${board}`;
    }

    if (security) {
        url += `/securities/${security}`;
    }

    if (ending) {
        url += `/${ending}`;
    }

    return url + '.json?';
}

function makeQuery(params) {
    let query = new URLSearchParams({
        "iss.meta": "off",
    });

    if (params) {
        Object.keys(params).forEach(key => {
            query.append(key, params[key]);
        });
    }

    return query;
}

async function request(url, query) {
    query = query || makeQuery();

    console.log(url + query.toString());

    let res = await axios.get(url + query.toString());
    if (!res.ok) {
        throw new Error(`${url} axios error, status: ${res.statusText}`);
    }

    return await res.json();
}

export { MoexISS };