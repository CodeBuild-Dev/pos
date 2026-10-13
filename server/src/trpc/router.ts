import { router } from './index';
import { authRouter } from '../routes/auth.router';
import { productRouter } from '../routes/product.router';
import { categoryRouter } from '../routes/category.router';
import { saleRouter } from '../routes/sale.router';
import { customerRouter } from '../routes/customer.router';
import { dashboardRouter } from '../routes/dashboard.router';
import { userRouter } from '../routes/user.router';

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  category: categoryRouter,
  sale: saleRouter,
  customer: customerRouter,
  dashboard: dashboardRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
