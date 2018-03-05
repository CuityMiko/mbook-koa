<style lang="less">
@import "../styles/common.less";
@import "./tables/components/table.less";

.theme-container .title {
  height: 32px;
  line-height: 32px;
}
.theme-container .add-icon {
  float: right;
}
.theme-container .overflow-text {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.theme-container .ivu-tooltip-inner {
  max-width: inherit;
}
.theme-container .change-btn {
  margin-right: 15px;
}
.theme-container .modal-container {
  width: 600px;
  position: absolute;
  left: 50%;
  top: 0;
  margin-left: -300px;
}
.textarea.ivu-input{
  font-size: 12px;
}
</style>

<template>
    <div class="theme-container">
        <Row class="margin-top-10">
            <Col span="24">
                <Card>
                    <p class="title" slot="title">主题管理<Button class="add-icon" type="primary" icon="android-add" @click="handleAdd">新增主题</Button></p>
                    <dragable-table refs="table" v-model="tableData" :columns-list="columnsList" :loading="loading" @on-start="handleDragStart" @on-end="handleDragEnd"></dragable-table>
                </Card>
                <Modal v-model="isShowModal" :title="modalTitle" :loading="modalLoading" @on-ok="handleModalConfrim" @on-cancel="handleModalCancel" width="600" :mask-closable="false">
                  <Form ref="modalForm" :model="modalData" :rules="modalRule" :label-width="80">
                    <FormItem prop="name" label="主题名称" :error="modalError.name">
                        <Input v-model="modalData.name" placeholder="请输入主题名称"></Input>
                    </FormItem>
                    <FormItem prop="des" label="描述" :error="modalError.des">
                        <Input v-model="modalData.des" type="textarea" :autosize="{minRows: 2,maxRows: 5}" placeholder="输入主题描述" style="font-size: 12px"></Input>
                    </FormItem>
                    <FormItem prop="layout" label="布局方式" :error="modalError.layout">
                        <Select v-model="modalData.layout" placeholder="请选择布局方式">
                            <Option value="1">4书展示</Option>
                            <Option value="2">3书纵向展示</Option>
                            <Option value="3">3书横向展示</Option>
                        </Select>
                    </FormItem>
                    <FormItem prop="flush" label="是否可刷新" :error="modalError.flush">
                        <i-switch v-model="modalData.flush">
                          <Icon type="android-done" slot="open"></Icon>
                          <Icon type="android-close" slot="close"></Icon>
                        </i-switch>
                    </FormItem>
                    <FormItem prop="show" label="是否展示" :error="modalError.show">
                        <i-switch v-model="modalData.show">
                          <Icon type="android-done" slot="open"></Icon>
                          <Icon type="android-close" slot="close"></Icon>
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

function layoutWay(layout){
  if(layout === 1){
    return '4书展示'
  }else if(layout === 2){
    return '3书纵向展示'
  }else if(layout === 3){
    return '3书横向展示'
  }else{
    return ''
  }
}

export default {
  name: "theme",
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
          title: "主题名称",
          align: "center",
          key: "name",
          width: 150,
          ellipsis: true,
        },
        {
          title: "描述",
          align: "center",
          key: "des"
        },
        {
          title: "布局方式",
          align: "center",
          key: "layout",
          render: (h, params) => {
            return h('Tag', layoutWay(params.row.layout))
          }
        },
        {
          title: "是否可刷新",
          align: "center",
          key: "flush",
          render: (h, params) => {
            return h("span", params.row.flush ? '是' : '否')
          }
        },
        {
          title: "是否展示",
          align: "center",
          key: "show",
          render: (h, params) => {
            return h("i-switch", {
              props: {
                'value': params.row.show
              },
              on: {
                'on-change': val => {
                  http.patch('/api/theme/' + params.row._id, {show: val}, '更新主题').then(res => {
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
          render: (h, params) => {
            return h("span", moment(params.row.create_time).format('YYYY/MM/DD HH:MM:SS'))
          }
        },
        {
          title: '拖拽排序',
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
          width: 280,
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
                    this.modalTitle = '修改主题';
                    this.isAddOrUpdateModal = 'update';
                    this.currentBannerId = params.row._id;
                  }
                }
              }, '编辑书籍'),
              h('Button', {
                class: 'change-btn',
                props: {
                  type: 'primary'
                },
                on: {
                  'click': () => {
                    // 打开修改弹窗
                    this.modalData = {
                      name: params.row.name,
                      des: params.row.des,
                      layout: params.row.layout.toString(),
                      flush: params.row.flush,
                      show: params.row.show
                    };
                    this.isShowModal = true;
                    this.modalTitle = '修改主题';
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
                      content: '确定要删除此主题？',
                      onOk: () => {
                        http.delete('/api/theme/' + params.row._id , {}, '删除主题').then(res => {
                          if(res.data && res.data.ok){
                            // 更新tableData
                            this.isShowModal = false;
                            this.$Message.success('删除主题成功');
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
      hasDraged: false,
      isDraging: false, // 处在拖拽状态
      isShowModal: false, // 控制modal的显隐
      modalLoading: true, // 点击modal确定按钮是否显示loading
      modalTitle: '', // modal标题
      isAddOrUpdateModal: '', // 是新增弹窗或者更新弹窗
      currentBannerId: '', // 当前正在修改的主题Id
      modalData: {},
      modalRule: {
        name: [
          { required: true, message: '请输入图片地址', trigger: 'blur' }
        ],
        des: [],
        layout: [
          { required: true, message: '请选择布局方式', trigger: 'change' }
        ],
        flush: [],
        show: []
      },
      modalError: {} // modal错误提示信息
    }
  },
  methods: {
    getData() {
      this.loading = false;
      http.get("/api/theme", {}, "获取主题").then(res => {
        this.loading = false;
        if (res.data && res.data.ok) {
          this.tableData = res.data.list
        }
      })
    },
    handleDragStart(from){
      this.hasDraged = true
      this.isDraging = true
    },
    handleDragEnd(e){
      this.isDraging = false
      if(e.to !== e.from){
        // 发送交换请求
        http.post('/api/theme/exchange', {from_index: e.from, to_index: e.to}, '交换顺序').then(res => {
          console.log(res)
          if(res.data && res.data.ok){
            this.getData()
          }
        })
      }
      return false
    },
    // 点击新增主题
    handleAdd(){
      // 打开新增弹窗
      this.modalData = {
        img_url: '',
        des: '',
        type: '',
        url: '',
        show: false
      };
      this.isShowModal = true
      this.modalTitle = '新增主题'
      this.isAddOrUpdateModal = 'add'
    },
    handleModalConfrim(){
      let self = this
      // 合法性校验
      self.$refs['modalForm'].validate((valid) => {
        if (valid) {
          let isOk = true
          if(self.modalData.des.length > 10){
            self.modalError.des = Math.random().toString()
            self.$nextTick(function(){
              self.modalError.des = '请输入0至10个字的主题名称'
            })
            isOk = false
          }
          if(self.modalData.des.length > 100){
            self.modalError.des = Math.random().toString()
            self.$nextTick(function(){
              self.modalError.des = '请输入0至100个字的描述'
            })
            isOk = false
          }
          if(self.modalData.layout !== '1' && self.modalData.layout !== '2' && self.modalData.layout !== '3'){
            self.modalError.layout = Math.random().toString()
            self.$nextTick(function(){
              self.modalError.type = '请选择布局方式'
            })
            isOk = false
          }
          // 如果全部校验通过，发送POST请求
          if(isOk){
            if(self.isAddOrUpdateModal === 'add'){
              http.post('/api/theme', self.modalData, '新增主题').then(res => {
                self.modalLoading = false
                // 避免校验完直接关闭弹窗
                self.$nextTick(() => {
                  self.modalLoading = true
                })
                if(res.data && res.data.ok){
                  self.isShowModal = false
                  self.$Message.success('新增主题成功')
                  self.getData()
                }
              }).catch(err => {
                self.modalLoading = false
                self.$nextTick(() => {
                  self.modalLoading = true
                })
              })
            }else if(self.isAddOrUpdateModal === 'update'){
              http.patch('/api/theme/' + self.currentBannerId, self.modalData, '修改主题').then(res => {
                self.modalLoading = false
                // 避免校验完直接关闭弹窗
                self.$nextTick(() => {
                  self.modalLoading = true
                })
                if(res.data && res.data.ok){
                  self.isShowModal = false
                  self.$Message.success('修改主题成功')
                  self.getData()
                }
              }).catch(err => {
                self.modalLoading = false
                self.$nextTick(() => {
                  self.modalLoading = true
                })
              })
            }
          }else{
            self.modalLoading = false
            self.$nextTick(() => {
              self.modalLoading = true
            })
          }
        }else{
          self.modalLoading = false
          self.$nextTick(() => {
            self.modalLoading = true
          })
        }
      })
    },
    handleModalCancel(){
      this.$refs['modalForm'].resetFields()
    }
  },
  created() {
    this.getData()
  }
}
</script>DragableTable
