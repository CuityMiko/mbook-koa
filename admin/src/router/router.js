import Main from '@/views/Main.vue';
import Login from '@/views/login.vue'
import Error404 from '@/views/error-page/404.vue'
import Error403 from '@/views/error-page/403.vue'
import Error500 from '@/views/error-page/500.vue'
import Preview from '@/views/form/article-publish/preview.vue'
import LockingPage from '@/views/main-components/lockscreen/components/locking-page.vue'
import Home from '@/views/home/home.vue'
import OwnSpace from '@/views/own-space/own-space.vue'
import OrderInfo from '@/views/advanced-router/component/order-info.vue'
import ShoppingInfo from '@/views/advanced-router/component/shopping-info.vue'
import Message from '@/views/message/message.vue'
import Access from '@/views/access/access.vue'
import AccessTest from '@/views/access/access-test.vue'
import International from '@/views/international/international.vue'
import TextEditor from '@/views/my-components/text-editor/text-editor.vue'
import MarkdownEditor from '@/views/my-components/markdown-editor/markdown-editor.vue'
import ImageEditor from '@/views/my-components/image-editor/image-editor.vue'
import DraggableList from '@/views/my-components/draggable-list/draggable-list.vue'
import AreaLinkage from '@/views/my-components/area-linkage/area-linkage.vue'
import FileUpload from '@/views/my-components/file-upload/file-upload.vue'
import Count from '@/views/my-components/count-to/count-to.vue'
import SplitPanePage from '@/views/my-components/split-pane/split-pane-page.vue'
import ArticalPublish from '@/views/form/article-publish/article-publish.vue'
import Workflow from '@/views/form/work-flow/work-flow.vue'
import DraggableTable from '@/views/tables/dragable-table.vue'
import EditableTable from '@/views/tables/editable-table.vue'
import SearchTable from '@/views/tables/searchable-table.vue'
import ExportableTable from '@/views/tables/exportable-table.vue'
import TableToImage from '@/views/tables/table-to-image.vue'
import MutativeRouter from '@/views/advanced-router/mutative-router.vue'
import ArgumentPage from '@/views/advanced-router/argument-page.vue'
import ErrorPage from '@/views/error-page/error-page.vue'


// 不作为Main组件的子页面展示的页面单独写，如下
export const loginRouter = {
    path: '/login',
    name: 'login',
    meta: {
        title: 'Login - 登录'
    },
    component: () => Login
};

export const page404 = {
    path: '/*',
    name: 'error-404',
    meta: {
        title: '404-页面不存在'
    },
    component: () => Error404
};

export const page403 = {
    path: '/403',
    meta: {
        title: '403-权限不足'
    },
    name: 'error-403',
    component: () => Error403
};

export const page500 = {
    path: '/500',
    meta: {
        title: '500-服务端错误'
    },
    name: 'error-500',
    component: () => Error505
};

export const preview = {
    path: '/preview',
    name: 'preview',
    component: () => Preview
};

export const locking = {
    path: '/locking',
    name: 'locking',
    component: () => LockingPage
};

// 作为Main组件的子页面展示但是不在左侧菜单显示的路由写在otherRouter里
export const otherRouter = {
    path: '/',
    name: 'otherRouter',
    redirect: '/home',
    component: Main,
    children: [
        { path: 'home', title: {i18n: 'home'}, name: 'home_index', component: () => Home },
        { path: 'ownspace', title: '个人中心', name: 'ownspace_index', component: () => OwnSpace },
        { path: 'order/:order_id', title: '订单详情', name: 'order-info', component: () => OrderInfo }, // 用于展示动态路由
        { path: 'shopping', title: '购物详情', name: 'shopping', component: () => ShoppingInfo }, // 用于展示带参路由
        { path: 'message', title: '消息中心', name: 'message_index', component: () => Message }
    ]
};

// 作为Main组件的子页面展示并且在左侧菜单显示的路由写在appRouter里
export const appRouter = [
    {
        path: '/access',
        icon: 'key',
        name: 'access',
        title: '权限管理',
        component: Main,
        children: [
            { path: 'index', title: '权限管理', name: 'access_index', component: () => Access }
        ]
    },
    {
        path: '/access-test',
        icon: 'lock-combination',
        title: '权限测试页',
        name: 'accesstest',
        access: 0,
        component: Main,
        children: [
            { path: 'index', title: '权限测试页', name: 'accesstest_index', access: 0, component: () => AccessTest }
        ]
    },
    {
        path: '/international',
        icon: 'earth',
        title: {i18n: 'international'},
        name: 'international',
        component: Main,
        children: [
            { path: 'index', title: {i18n: 'international'}, name: 'international_index', component: () => International }
        ]
    },
    {
        path: '/component',
        icon: 'social-buffer',
        name: 'component',
        title: '组件',
        component: Main,
        children: [
            {
                path: 'text-editor',
                icon: 'compose',
                name: 'text-editor',
                title: '富文本编辑器',
                component: () => TextEditor
            },
            {
                path: 'md-editor',
                icon: 'pound',
                name: 'md-editor',
                title: 'Markdown编辑器',
                component: () => MarkdownEditor
            },
            {
                path: 'image-editor',
                icon: 'crop',
                name: 'image-editor',
                title: '图片预览编辑',
                component: () => ImageEditor
            },
            {
                path: 'draggable-list',
                icon: 'arrow-move',
                name: 'draggable-list',
                title: '可拖拽列表',
                component: () => DraggableList
            },
            {
                path: 'area-linkage',
                icon: 'ios-more',
                name: 'area-linkage',
                title: '城市级联',
                component: () => AreaLinkage
            },
            {
                path: 'file-upload',
                icon: 'android-upload',
                name: 'file-upload',
                title: '文件上传',
                component: () => FileUpload
            },
            {
                path: 'count-to',
                icon: 'arrow-graph-up-right',
                name: 'count-to',
                title: '数字渐变',
                // component: () => import('@/views/my-components/count-to/count-to.vue')
                component: () => CountTo
            },
            {
                path: 'split-pane-page',
                icon: 'ios-pause',
                name: 'split-pane-page',
                title: 'split-pane',
                component: () => SplitPanePage
            }
        ]
    },
    {
        path: '/form',
        icon: 'android-checkbox',
        name: 'form',
        title: '表单编辑',
        component: Main,
        children: [
            { path: 'artical-publish', title: '文章发布', name: 'artical-publish', icon: 'compose', component: () => ArticalPublish },
            { path: 'workflow', title: '工作流', name: 'workflow', icon: 'arrow-swap', component: () => Workflow }

        ]
    },
    // {
    //     path: '/charts',
    //     icon: 'ios-analytics',
    //     name: 'charts',
    //     title: '图表',
    //     component: Main,
    //     children: [
    //         { path: 'pie', title: '饼状图', name: 'pie', icon: 'ios-pie', component: resolve => { require('@/views/access/access.vue') },
    //         { path: 'histogram', title: '柱状图', name: 'histogram', icon: 'stats-bars', component: resolve => { require('@/views/access/access.vue') }

    //     ]
    // },
    {
        path: '/tables',
        icon: 'ios-grid-view',
        name: 'tables',
        title: '表格',
        component: Main,
        children: [
            { path: 'dragableTable', title: '可拖拽排序', name: 'dragable-table', icon: 'arrow-move', component: () => DraggableTable },
            { path: 'editableTable', title: '可编辑表格', name: 'editable-table', icon: 'edit', component: () => EditableTable },
            { path: 'searchableTable', title: '可搜索表格', name: 'searchable-table', icon: 'search', component: () => SearchTable },
            { path: 'exportableTable', title: '表格导出数据', name: 'exportable-table', icon: 'code-download', component: () => ExportableTable },
            { path: 'table2image', title: '表格转图片', name: 'table-to-image', icon: 'images', component: () => TableToImage }
        ]
    },
    {
        path: '/advanced-router',
        icon: 'ios-infinite',
        name: 'advanced-router',
        title: '高级路由',
        component: Main,
        children: [
            { path: 'mutative-router', title: '动态路由', name: 'mutative-router', icon: 'link', component: () => MutativeRouter },
            { path: 'argument-page', title: '带参页面', name: 'argument-page', icon: 'android-send', component: () => ArgumentPage }
        ]
    },
    {
        path: '/error-page',
        icon: 'android-sad',
        title: '错误页面',
        name: 'errorpage',
        component: Main,
        children: [
            { path: 'index', title: '错误页面', name: 'errorpage_index', component: () => ErrorPage }
        ]


    }
];

// 所有上面定义的路由都要写在下面的routers里
export const routers = [
    loginRouter,
    otherRouter,
    preview,
    locking,
    ...appRouter,
    page500,
    page403,
    page404
];
