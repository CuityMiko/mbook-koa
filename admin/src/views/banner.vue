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
.banner-container .textarea.ivu-input{
  font-size: 12px;
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
                <Modal v-model="isShowModal" :title="modalTitle" :loading="modalLoading" @on-ok="handleModalConfrim" @on-cancel="handleModalCancel" width="600" :mask-closable="false">
                  <Form ref="modalForm" :model="modalData" :rules="modalRule" :label-width="80">
                    <FormItem prop="img_url" label="图片地址" :error="modalError.img_url">
                        <Input v-model="modalData.img_url" placeholder="请输入banner图片地址"></Input>
                    </FormItem>
                    <FormItem prop="des" label="描述" :error="modalError.des">
                        <Input v-model="modalData.des" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="输入banner描述"></Input>
                    </FormItem>
                    <FormItem prop="type" label="跳转类型" :error="modalError.type">
                        <Select v-model="modalData.type">
                            <Option value="0">小程序链接</Option>
                            <Option value="1">第三方链接</Option>
                        </Select>
                    </FormItem>
                    <FormItem prop="url" label="跳转地址" :error="modalError.url">
                        <Input v-model="modalData.url" placeholder="请输入跳转地址"></Input>
                    </FormItem>
                    <FormItem prop="show" label="是否显示" :error="modalError.show">
                        <i-switch v-model="modalData.show" size="large">
                            <span slot="open">显示</span>
                            <span slot="close">隐藏</span>
                        </i-switch>
                    </FormItem>
                  </Form>
                </Modal>
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
      isShowModal: false, // 控制modal的显隐
      modalLoading: true, // 点击modal确定按钮是否显示loading
      modalTitle: '', // modal标题
      isAddOrUpdateModal: '', // 是新增弹窗或者更新弹窗
      modalData: {},
      modalRule: {
        img_url: [
          { required: true, message: '请输入图片地址', trigger: 'blur' }
        ],
        des: [],
        type: [
          { required: true, message: '请选择跳转类型', trigger: 'blur' }
        ],
        url: [
          { required: true, message: '请输入跳转地址', trigger: 'blur' }
        ],
        show: []
      },
      modalError: {} // modal错误提示信息
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
        show: false
      };
      this.isShowModal = true;
      this.modalTitle = '新增banner';
      this.isAddOrUpdateModal = 'add';
    },
    handleModalConfrim(){
      let self = this;
      // 合法性校验
      self.$refs['modalForm'].validate((valid) => {
        if (valid) {
          console.log('合法')
          let imgUrlRegExp = /^(http|https):\/\/.+\.(jpg|png|JPG|PNG|gif)$/;
          let urlRegExp = /^((\/pages\/.+)|(https:\/\/.+))$/;
          let isOk = true;
          if(!imgUrlRegExp.test(self.modalData.img_url)){
            self.modalError.img_url = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.img_url = '图片地址不合法';
            });
            isOk = false;
          }
          if(self.modalData.des.length > 100){
            self.modalError.des = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.des = '请输入0至100个字的描述';
            });
            isOk = false;
          }
          if(self.modalData.type !== '0' && self.modalData.type !== '1' ){
            self.modalError.type = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.type = '请选择跳转类型';
            });
            isOk = false;
          }
          if(self.modalData.type !== '0' && self.modalData.type !== '1' ){
            self.modalError.type = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.type = '请选择跳转类型';
            });
            isOk = false;
            self.modalData.type = parseInt(self.modalData.type)
          }
          console.log(!urlRegExp.test(self.modalData.url))
          if(!urlRegExp.test(self.modalData.url)){
            self.modalError.url = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.url = '跳转地址不合法';
            });
            isOk = false;
          }
          console.log(isOk)
          // 如果全部校验通过，发送POST请求
          if(isOk){
            http.post('/api/banner', self.modalData, '新增banner').then(res => {
              self.modalLoading = false;
              // 避免校验完直接关闭弹窗
              self.$nextTick(() => {
                self.modalLoading = true;
              });
              if(res.data.ok){
                console.log(res)
              }
            }).catch(err => {
              self.modalLoading = false;
              self.$nextTick(() => {
                self.modalLoading = true;
              });
            })
          }else{
            self.modalLoading = false;
            self.$nextTick(() => {
              self.modalLoading = true;
            });
          }
        }else{
          self.modalLoading = false;
          self.$nextTick(() => {
            self.modalLoading = true;
          });
        }
      })
    },
    handleModalCancel(){
      this.$refs['modalForm'].resetFields();
    }
  },
  created() {
    this.getData();
  }
};
</script>DragableTable
