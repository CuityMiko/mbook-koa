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
                    <dragable-table refs="table" v-model="tableData" :columns-list="columnsList" :loading="loading" @on-start="handleDragStart" @on-end="handleDragEnd"></dragable-table>
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
                        <Select v-model="modalData.type" placeholder="请选择跳转类型">
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
                    if(res.data && res.data.ok){
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
          render: (h, params) => {
            return h("div", [
              h('Button', {
                class: 'change-btn',
                props: {
                  type: 'primary'
                },
                on: {
                  'click': () => {
                    console.log(params.row.type)
                    // 打开修改弹窗
                    this.modalData = {
                      img_url: params.row.img_url,
                      des: params.row.des,
                      type: params.row.type.toString(),
                      url: params.row.url,
                      show: params.row.show
                    };
                    this.isShowModal = true;
                    this.modalTitle = '修改banner';
                    this.isAddOrUpdateModal = 'update';
                    this.currentBannerId = params.row._id;
                  }
                }
              }, '修改'),
              h('Button', {
                props: {
                  type: 'error'
                },
                on: {
                  'click': () => {
                    this.$Modal.confirm({
                      title: '温馨提示',
                      content: '确定要删除此banner？',
                      onOk: () => {
                        http.delete('/api/banner/' + params.row._id , {}, '删除banner').then(res => {
                          if(res.data && res.data.ok){
                            // 更新tableData
                            this.isShowModal = false;
                            this.$Message.success('删除banner成功');
                            this.getData();
                          }
                        });
                      },
                      onCancel: () => {}
                    });
                  }
                }
              }, '删除')
            ])
          }
        }
      ],
      page: 1,
      limit: 10,
      total: 0,
      hasDraged: false,
      isDraging: false, // 处在拖拽状态
      isShowModal: false, // 控制modal的显隐
      modalLoading: true, // 点击modal确定按钮是否显示loading
      modalTitle: '', // modal标题
      isAddOrUpdateModal: '', // 是新增弹窗或者更新弹窗
      currentBannerId: '', // 当前正在修改的banner Id
      modalData: {},
      modalRule: {
        img_url: [
          { required: true, message: '请输入图片地址', trigger: 'blur' }
        ],
        des: [],
        type: [
          { required: true, message: '请选择跳转类型', trigger: 'change' }
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
      this.loading = false;
      http.get("/api/banner", {page: this.page, limit: this.limit}, "获取banner").then(res => {
        this.loading = false;
        if (res.data && res.data.ok) {
          this.tableData = res.data.list;
          this.total = res.data.total;
        }
      });
    },
    handleDragStart(from){
      this.hasDraged = true
      this.isDraging = true
    },
    handleDragEnd(e){
      this.isDraging = false
      if(e.to !== e.from){
        // 发送交换请求
        http.post('/api/banner/exchange', {from_index: e.from, to_index: e.to}, '交换顺序').then(res => {
          console.log(res)
          if(res.data && res.data.ok){
            this.getData()
          }
        })
      }
      return false
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
          if(!urlRegExp.test(self.modalData.url)){
            self.modalError.url = Math.random().toString();
            self.$nextTick(function(){
              self.modalError.url = '跳转地址不合法';
            });
            isOk = false;
          }
          // 如果全部校验通过，发送POST请求
          if(isOk){
            if(self.isAddOrUpdateModal === 'add'){
              http.post('/api/banner', self.modalData, '新增banner').then(res => {
                self.modalLoading = false;
                // 避免校验完直接关闭弹窗
                self.$nextTick(() => {
                  self.modalLoading = true;
                });
                if(res.data && res.data.ok){
                  self.isShowModal = false;
                  self.$Message.success('新增banner成功');
                  self.getData();
                }
              }).catch(err => {
                self.modalLoading = false;
                self.$nextTick(() => {
                  self.modalLoading = true;
                });
              })
            }else if(self.isAddOrUpdateModal === 'update'){
              http.patch('/api/banner/' + self.currentBannerId, self.modalData, '修改banner').then(res => {
                self.modalLoading = false;
                // 避免校验完直接关闭弹窗
                self.$nextTick(() => {
                  self.modalLoading = true;
                });
                if(res.data && res.data.ok){
                  self.isShowModal = false;
                  self.$Message.success('修改banner成功');
                  self.getData();
                }
              }).catch(err => {
                self.modalLoading = false;
                self.$nextTick(() => {
                  self.modalLoading = true;
                });
              })
            }
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
