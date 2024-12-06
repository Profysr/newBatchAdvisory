import { ManageIndividualClass } from "@/components/Page/Manage-Classes";
import React from "react";

const page = async ({ params }) => {
  const { slug } = await params;
  return <ManageIndividualClass slug={slug} />;
};

export default page;
