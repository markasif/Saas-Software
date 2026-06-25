import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { redirect } from "next/navigation";


export default async function Home() {

  const session  = await getServerSession(authOptions);

  if(!session || !session.user) {
    redirect("/login");
  }

  const userMembership = session.user.memberships || [];

  if(userMembership.length > 0) {

    console.log("daaaaaaaaaaaaaaata",userMembership);

    const defaultSlug = userMembership[0].organization.slug;

    redirect(`/org/${defaultSlug}/dashboard`);
  } else {
    redirect("/register-org")
  }
  

}