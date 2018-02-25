<style lang="less">
@import "../styles/common.less";
@import "./tables/components/table.less";

.banner-container .title {
  height: 32px;
  line-height: 32px;
}
.banner-container .add-icon {
  float: right;
}
.banner-container .overflow-text {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.banner-container .ivu-tooltip-inner {
  max-width: inherit;
}
.banner-container .change-btn {
  margin-right: 15px;
}
.banner-container .page-tool {
  margin-top: 20px;
  text-align: right;
}
.banner-container .modal-container {
  width: 600px;
  position: absolute;
  left: 50%;
  top: 0;
  margin-left: -300px;
}
</style>

<template>
    <div class="banner-container">
        <Row class="margin-top-10">
            <Col span="24">
                <Card>
                    <p class="title" slot="title">首页广告配置<Button class="add-icon" type="primary" icon="android-add" @click="handleAdd">新增banner</Button></p>
                    <div class="edittable-table-height-con">
                        <dragable-table refs="table" v-model="tableData" :columns-list="columnsList" :loading="loading"></dragable-table>
                    </div>
                    <Page class="page-tool" :total="total" :current="page" @on-change="handlePageChange" show-total></Page>
                </Card>
                <Card class="modal-container" v-if="isShowModal">
                  <p class="title" slot="title">新增banner</p>
                  <Form :model="modalData" :label-width="80">
                    <FormItem label="图片地址">
                        <Input v-model="modalData.img_url" placeholder="请输入banner图片地址"></Input>
                    </FormItem>
                    <FormItem label="描述">
                        <Input v-model="modalData.des" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="输入banner描述"></Input>
                    </FormItem>
                    <FormItem label="跳转类型">
                        <Select v-model="modalData.select">
                            <Option value="0">小程序链接</Option>
                            <Option value="1">第三方链接</Option>
                        </Select>
                    </FormItem>
                    <FormItem label="Radio">
                        <RadioGroup v-model="modalData.radio">
                            <Radio label="male">Male</Radio>
                            <Radio label="female">Female</Radio>
                        </RadioGroup>
                    </FormItem>
                    <FormItem label="Checkbox">
                        <CheckboxGroup v-model="modalData.checkbox">
                            <Checkbox label="Eat"></Checkbox>
                            <Checkbox label="Sleep"></Checkbox>
                            <Checkbox label="Run"></Checkbox>
                            <Checkbox label="Movie"></Checkbox>
                        </CheckboxGroup>
                    </FormItem>
                    <FormItem label="Switch">
                        <i-switch v-model="modalData.switch" size="large">
                            <span slot="open">On</span>
                            <span slot="close">Off</span>
                        </i-switch>
                    </FormItem>
                    <FormItem label="Slider">
                        <Slider v-model="modalData.slider" range></Slider>
                    </FormItem>
                    
                    <FormItem>
                        <Button type="primary">Submit</Button>
                        <Button type="ghost" style="margin-left: 8px">Cancel</Button>
                    </FormItem>
                  </Form>
                </Card>
            </Col>
        </Row>
    </div>
</template>

<script>
import dragableTable from "./tables/components/dragableTable.vue";
import tableData from "./tables/components/table_data.js";
import http from "../libs/http";
import moment from 'moment';

export default {
  name: "banner",
  components: {
    dragableTable
  },
  data() {
    return {
      loading: true,
      tableData: [],
      columnsList: [
        {
          title: "序号",
          type: "index",
          width: 80,
          align: "center"
        },
        {
          title: "banner图片地址",
          align: "center",
          key: "img_url",
          ellipsis: true,
          editable: true,
          render: (h, params) => {
            return h("a", {
              attrs: {
                href: params.row.img_url,
                target: '_blank'
              }
            }, params.row.img_url);
          }
        },
        {
          title: "描述",
          align: "center",
          key: "des",
          width: 150,
          editable: true
        },
        {
          title: "跳转类型",
          align: "center",
          key: "type",
          editable: true,
          sortable: true,
          render: (h, params) => {
            return h('Tag', params.row.type === 0 ? '小程序页面' : (params.row.type === 1 ? '第三方页面' : '未知类型'))
          }
        },
        {
          title: "点击跳转地址",
          align: "center",
          key: "url",
          sortable: true,
          ellipsis: true,
          render: (h, params) => {
            return h("Tooltip", {
              class: 'overflow-text',
              props: {
                content: params.row.url
              }
            }, [h('span', params.row.url)])
          }
        },
        {
          title: "是否展示",
          align: "center",
          key: "show",
          sortable: true,
          render: (h, params) => {
            return h("i-switch", {
              props: {
                'value': params.row.show
              },
              on: {
                'on-change': val => {
                  http.patch('/api/banner/' + params.row._id, {show: val}, '更新banner').then(res => {
                    if(res.data.ok){
                      // 更新tableData
                      this.tableData.forEach(element => {
                        if(element._id === params.row._id){
                          element.show = val;
                        }
                      });
                    }
                  })
                }
              }
            })
          }
        },
        {
          title: "创建时间",
          align: "center",
          key: "create_time",
          sortable: true,
          render: (h, params) => {
            return h("span", moment(params.row.create_time).format('YYYY/MM/DD HH:MM:SS'))
          }
        },
        {
          title: '拖拽',
          key: 'drag',
          width: 90,
          align: 'center',
          render: (h) => {
            return h(
              'Icon',
              {
                props: {
                  type: 'arrow-move',
                  size: 20
                }
              }
            );
          }
        },
        {
          title: "操作",
          align: "center",
          width: 190,
          key: "handle",
          render: h => {
            return h("div", [
              h('Button', {
                class: 'change-btn',
                props: {
                  type: 'primary'
                }
              }, '修改'),
              h('Button', {
                props: {
                  type: 'error'
                }
              }, '删除')
            ])
          }
        }
      ],
      page: 1,
      limit: 10,
      total: 0,
      isShowModal: false,
      modalData: {}
    };
  },
  methods: {
    getData() {
      this.tableData = tableData.table1Data;
      http.get("/api/banner", {page: this.page, limit: this.limit}, "获取banner").then(res => {
        this.loading = false;
        if (res.data.ok) {
          this.tableData = res.data.list;
          this.total = res.data.total;
        }
      });
    },
    handleNetConnect(state) {
      this.breakConnect = state;
    },
    handleLowSpeed(state) {
      this.lowNetSpeed = state;
    },
    getCurrentData() {
      this.showCurrentTableData = true;
    },
    handleDel(val, index) {
      this.$Message.success("删除了第" + (index + 1) + "行数据");
    },
    handleCellChange(val, index, key) {
      this.$Message.success(
        "修改了第 " + (index + 1) + " 行列名为 " + key + " 的数据"
      );
    },
    handleChange(val, index) {
      this.$Message.success("修改了第" + (index + 1) + "行数据");
    },
    // 点击分页
    handlePageChange(val){
      this.page = val;
      this.getData();
    },
    // 点击新增banner
    handleAdd(){
      // 打开新增弹窗
      this.modalData = {
        img_url: '',
        des: '',
        type: '',
        url: '',
        show: ''
      };
      this.isShowModal = true;
      this.$store.commit('changeModal', true);
      console.log(this.$store.state.isShowModal)
    }
  },
  created() {
    this.getData();
  }
};
</script>DragableTable
