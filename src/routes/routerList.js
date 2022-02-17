import { Broadcast } from '../pages/Broadcast/Broadcast';
import { Home } from '../pages/Home/Home'
import Viewer from '../pages/Viewer/Viewer';

const routerList = [
  {
    key: 1,
    label: "Home",
    path: "/",
    component: Home,
    hasNavbar: true,
  },
  {
    key: 2,
    label: "Broadcast-stream",
    path: "broadcast-stream",
    component: Broadcast,
    hasNavbar: true,
  },
  {
    key: 3,
    label: "Viewer",
    path: "viewers",
    component: Viewer,
    hasNavbar: true,
  },
];

export default routerList
