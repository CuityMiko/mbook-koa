<style lang="less">
    @import '../../styles/common.less';
    @import './components/table.less';
</style>

<template>
    <div>
        <Row class="margin-top-10">
            <i-col span="24">
                <i-card>
                    <p slot="title">
                        <i-icon type="android-remove"></i-icon>
                        可编辑单元行
                    </p>
                    <div class="edittable-table-height-con">
                        <can-edit-table refs="table2" v-model="editInlineData" :columns-list="editInlineiColumns"></can-edit-table>
                    </div>
                </i-card>
            </i-col>
        </Row>
    </div>
</template>

<script>
import canEditTable from './components/canEditTable.vue';
import tableData from './components/table_data.js';
export default {
    name: 'banner',
    components: {
        canEditTable
    },
    data () {
        return {
            'columnsList': [],
            'tableData': [],
            'editInlineiColumns': [],
            'editInlineData': [],
            'editIncelliColumns': [],
            'editIncellData': [],
            'editInlineAndCelliColumn': [],
            'editInlineAndCellData': [],
            'showCurrentiColumns': [],
            'showCurrentTableData': false
        };
    },
    methods: {
        getData () {
            this.columnsList = tableData.table1i-columns;
            this.tableData = tableData.table1Data;
            this.editInlineiColumns = tableData.editInlineiColumns;
            this.editInlineData = tableData.editInlineData;
            this.editIncelliColumns = tableData.editIncelliColumns;
            this.editIncellData = tableData.editIncellData;
            this.editInlineAndCelliColumn = tableData.editInlineAndCelliColumn;
            this.editInlineAndCellData = tableData.editInlineAndCellData;
            this.showCurrentiColumns = tableData.showCurrentiColumns;
        },
        handleNetConnect (state) {
            this.breakConnect = state;
        },
        handleLowSpeed (state) {
            this.lowNetSpeed = state;
        },
        getCurrentData () {
            this.showCurrentTableData = true;
        },
        handleDel (val, index) {
            this.$Message.success('删除了第' + (index + 1) + '行数据');
        },
        handleCellChange (val, index, key) {
            this.$Message.success('修改了第 ' + (index + 1) + ' 行列名为 ' + key + ' 的数据');
        },
        handleChange (val, index) {
            this.$Message.success('修改了第' + (index + 1) + '行数据');
        }
    },
    created () {
        this.getData();
    }
};
</script>
