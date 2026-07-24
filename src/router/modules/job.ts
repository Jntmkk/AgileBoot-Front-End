const Layout = () => import("@/layout/index.vue");

export default {
  path: "/job",
  name: "Job",
  component: Layout,
  redirect: "/job/instances",
  meta: {
    icon: "ri:time-line",
    title: "任务编排",
    rank: 6
  },
  children: [
    {
      path: "/job/instances",
      name: "JobInstanceList",
      component: () => import("@/views/job/instances/index.vue"),
      meta: { title: "任务列表" }
    },
    {
      path: "/job/instances/:id",
      name: "JobInstanceDetail",
      component: () => import("@/views/job/instances/detail.vue"),
      meta: { title: "任务详情", showLink: false }
    },
    {
      path: "/job/nodes",
      name: "JobNodeList",
      component: () => import("@/views/job/nodes/index.vue"),
      meta: { title: "节点管理" }
    }
  ]
} as RouteConfigsTable;
