<style lang="less">
@import "./login.less";
</style>

<template>
    <div class="login" @keydown.enter="handleSubmit">
        <div class="login-con">
            <Card :bordered="false">
                <p slot="title">
                    <Icon type="log-in"></Icon>
                    欢迎登录
                </p>
                <div class="form-con">
                    <Form ref="loginForm" :model="form" :rules="rules">
                        <FormItem prop="userName" :error="error.userName">
                            <i-input v-model="form.userName" placeholder="请输入用户名">
                                <span slot="prepend">
                                    <Icon :size="16" type="person"></Icon>
                                </span>
                            </i-input>
                        </FormItem>
                        <FormItem prop="password" :error="error.password">
                            <i-input type="password" v-model="form.password" placeholder="请输入密码">
                                <span slot="prepend">
                                    <Icon :size="14" type="locked"></Icon>
                                </span>
                            </i-input>
                        </FormItem>
                        <FormItem>
                            <Button @click="handleSubmit" type="primary" long>登录</Button>
                        </FormItem>
                    </Form>
                    <!-- <p class="login-tip">输入任意用户名和密码即可</p> -->
                </div>
            </Card>
        </div>
    </div>
</template>

<script>
import Cookies from "js-cookie";
import http from '../libs/http'
export default {
  data() {
    return {
      form: {
        userName: "mbookLidikang",
        password: ""
      },
      error: {
        userName: "",
        password: ""
      },
      rules: {
        userName: [
          { required: true, message: "账号不能为空", trigger: "blur" }
        ],
        password: [{ required: true, message: "密码不能为空", trigger: "blur" }]
      }
    }
  },
  methods: {
    handleSubmit() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          // 发送登录请求
          http.post('/api/user/login', {
            identity: 2,
            username: this.form.userName,
            password: this.form.password
          }, '登录').then(res => {
            if(res.data.ok){
              Cookies.set("user", this.form.userName)
              Cookies.set("admin_token", res.data.token)
              // Cookies.set("password", this.form.password)
              this.$store.commit("setAvator", res.data.userinfo.avatar)
              if (this.form.userName === "mbookLidikang") {
                Cookies.set("access", 0)
              } else {
                Cookies.set("access", 1)
              }
              this.$Message.success('登录成功')
              this.$router.push({name: "home_index"})
            }else{
              if (res.data.msg === "暂无此账户，请联系管理员" || res.data.msg === "账号未激活，请联系管理员") {
                this.error.userName = Math.random().toString()
                this.$nextTick(() => {
                  this.error.userName = res.data.msg
                })
              } else {
                this.error.password = Math.random().toString()
                this.$nextTick(() => {
                  this.error.password = res.data.msg
                })
              }
            }
          })
        }
      })
    }
  }
}
</script>

<style>

</style>
