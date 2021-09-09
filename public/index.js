import { MoexISS } from "./moexISS.js";

const stocksCheckerHeader = {
    data() {
        return {text: "Stock price checker"}
    },

    template: `
        <h1 text-center>{{ text }}</h1>
    `
};

const stocksCheckerInput = {
    template: `
        <input v-model="ticker" type="text" class="mx-2 px-3" placeholder="GAZP;SBER;ROSN">
        <button @click="onInputAccept" class="btn btn-primary px-5" type="button">Add</button>`,

    data() {
        return {
            ticker: 'GAZP;SBER;ROSN;POLY;PIKK;PLZL;ALRS;AFLT;LKOH;NLMK'
        }
    },

    methods: {
        async onInputAccept(event) {
            const tickers = this.ticker.split(';');

            tickers.forEach(ticker => {
                this.$root.$refs.dataTable.addTicker(ticker);
            });

            this.ticker = '';
        }
    }
};

const stocksCheckerTable = {
    template: `
        <table class="table">
        <thead class="thead-light">
        <tr>
            <th scope="col">Ticker</th>
            <th scope="col">Price</th>
            <th scope="col">Day Change</th>
            <th scope="col"></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(data, ticker) in tableRows" v-bind:class="data.animation" v-on:animationend="removeAnimation(ticker)">
            <td>{{ ticker }}</td>
            <td>{{ data.price }}</td>
            <td>{{ data.dayChange }} %</td>
            <td><button @click="removeItem" v-bind:id="ticker" type="button" class="btn btn-danger">Delete</button></td>
        </tr>
        </tbody>
    </table>`,

    created() {
        this.makeRefreshable(3000);
    },

    data() {
        return {
            tableRows: {}
        };
    },

    methods: {
        async addTicker(ticker) {
            if (this.tableRows[ticker]) {
                console.log('already in table');
                return;
            }

            try {
                await this.addItem(ticker);
            } catch(err) {
                console.log(err);
            }
        },

        async updateAll() {
            for (let id in this.tableRows) {
                await this.updateItem(id);
            }
        },

        makeRefreshable(period) {
            setInterval(() => {
                console.log('update table');
                this.updateAll();
            }, period);
        },

        async addItem(ticker) {
            let spec, info;

            try {
                spec = await MoexISS.spec(ticker);
                info = await MoexISS.info(spec.mainboard);
            } catch(err) {
                throw new Error(`Moex ISS query err: ${err}`);
            }

            this.tableRows[ticker] = {
                price: info.marketdata['LAST'],
                dayChange: info.marketdata['LASTTOPREVPRICE'],
                animation: '',
            };
        },

        async updateItem(ticker, price, dayChange) {
            const spec = await MoexISS.spec(ticker);
            const info = await MoexISS.info(spec.mainboard);

            const prevPrice = this.tableRows[ticker].price;

            this.tableRows[ticker].price = info.marketdata['LAST'];
            this.tableRows[ticker].dayChange = info.marketdata['LASTTOPREVPRICE'];

            if (this.tableRows[ticker].price > prevPrice) {
                this.tableRows[ticker].animation = 'fadeGreen';
            } else if (this.tableRows[ticker].price < prevPrice) {
                this.tableRows[ticker].animation = 'fadeRed';
            } else {
                this.tableRows[ticker].animation = '';
            }
        },

        removeItem(event) {
            const id = event.currentTarget.id;
            if (id in this.tableRows) {
                delete this.tableRows[id];
            }
        },

        removeAnimation(ticker) {
            this.tableRows[ticker].animation = '';
        }
    }
};

const app = Vue.createApp({
    components: {
        'app-header': stocksCheckerHeader,
        'app-input': stocksCheckerInput,
        'app-table': stocksCheckerTable
    }
});

const root = app.mount('#site-content');
