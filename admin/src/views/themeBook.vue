<style lang="less">
.auto-complete-item {
  padding: 4px 0;
  border-bottom: 1px solid #f6f6f6;
}
.auto-complete-group {
  font-size: 12px;
  padding: 4px 6px;
}
.auto-complete-group span {
  color: #666;
  font-weight: bold;
}
.auto-complete-group a {
  float: right;
}
.auto-complete-count {
  float: right;
  color: #999;
}
.auto-complete-more {
  display: block;
  margin: 0 auto;
  padding: 4px;
  text-align: center;
  font-size: 12px;
}
.theme-container .theme-info table{
  border-collapse: collapse;
}
.theme-container .theme-info table th {
  height: 30px;
  white-space: nowrap;
  overflow: hidden;
  background-color: #f8f8f9;
}
.theme-container .theme-info table td {
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  text-align: left;
  text-overflow: ellipsis;
  vertical-align: middle;
  border-bottom: 1px solid #e9eaec;
}
.theme-container .ivu-transfer-list{
  width: 400px;
}
</style>

<template>
<div class="theme-container">
 <Card class="theme-info" :bordered="false">
    <p slot="title">主题详情</p>
    <table>
      <colgroup>
        <col width="200">
        <col width="200">
      </colgroup>
      <thead>
        <th>属性</th>
        <th>属性值</th>
      </thead>
      <tbody>
        <tr>
          <td>ID</td>
          <td>{{themeInfo._id}}</td>
        </tr>
        <tr>
          <td>主题名称</td>
          <td>{{themeInfo.name}}</td>
        </tr>
        <tr>
          <td>描述</td>
          <td>{{themeInfo.des}}</td>
        </tr>
        <tr>
          <td>布局方式</td>
          <td>{{layoutWay}}</td>
        </tr>
        <tr>
          <td>顺序值</td>
          <td>{{themeInfo.priority}}</td>
        </tr>
        <tr>
          <td>包含书籍总数</td>
          <td style="color: #2d8cf0">{{themeInfo.books.length + '本'}}</td>
        </tr>
        <tr>
          <td>是否可刷新</td>
          <td>{{themeInfo.layout ? '是' : '否'}}</td>
        </tr>
        <tr>
          <td>是否展示</td>
          <td>{{themeInfo.show ? '是' : '否'}}</td>
        </tr>
        <tr>
          <td>创建时间</td>
          <td>{{themeInfo.create_time}}</td>
        </tr>
      </tbody>
    </table>
  </Card>
  <br>
  <Card>
    <p slot="title">编辑主题里的书籍</p>
    <Transfer
        :data="books"
        :target-keys="selectBooks"
        filterable
        :filter-method="searchBook"
        :titles = titles
        not-found-text="找不到对应书籍"
        :operations="['加入到主题中','从主题里移除']"
        @on-change="handleChange"></Transfer>
  </Card>
</div>
</template>

<script>
import http from "../libs/http";

export default {
  name: "theme_book",
  data() {
    return {
      themeInfo: {},
      titles: ["可选书籍", "已选书籍"],
      books: [],
      selectBooks: []
    };
  },
  computed: {
    layoutWay: function() {
      if (this.themeInfo.layout === 1) {
        return "4书展示";
      } else if (this.themeInfo.layout === 2) {
        return "3书纵向展示";
      } else if (this.themeInfo.layout === 3) {
        return "3书横向展示";
      } else {
        return "";
      }
    }
  },
  methods: {
    // get theme info
    getThemeInfo() {
      let self = this;
      http
        .get("/api/theme/" + this.$route.params.theme_id, {}, "获取主题详情")
        .then(res => {
          if (res.data && res.data.ok) {
            self.themeInfo = res.data.data;
          }
        });
    },
    searchBook() {},
    handleChange() {}
  },
  created() {
    this.getThemeInfo();
  }
};
</script>

