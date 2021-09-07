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
        <input v-model="ticker" type="text" class="mx-2 px-3" placeholder="Ticker here">
        <button @click="onInputAccept" class="btn btn-primary px-5" type="button">Add</button>`,

    data() {
        return {
            ticker: ''
        }
    },

    methods: {
        async onInputAccept(event) {
            const ticker = this.ticker;
            const spec = await MoexISS.spec(ticker);
            const info = await MoexISS.info(spec.mainboard);
            console.log(info);
            // this.$root.$refs.dataTable.addItem('33', '33', '33');
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
        <tr v-for="row in tableRows">
            <td>{{ row.ticker }}</td>
            <td>{{ row.price }}</td>
            <td>{{ row.dayChange }} %</td>
            <td><button type="button" class="btn btn-danger">Delete</button></td>
        </tr>
        </tbody>
    </table>`,

    data() {
        return {
            tableRows: []
        };
    },

    methods: {
        addItem(ticker, price, dayChange) {
            //this.tableRows.push({ticker: ticker, price: price, dayChange: dayChange});
            console.log('add item');
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
