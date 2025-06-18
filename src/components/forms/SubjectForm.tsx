"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import Image from "next/image";

const schema = z.object({
  subjectName: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long!" }),
  teachers: z.string().min(1, { message: "Teachers' name is required!" }),
});

type Inputs = z.infer<typeof schema>;

const SubjectForm = ({
  type,
  data,
}: {
  type: "create" | "update";
  data?: any;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
  });

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">Create a new student</h1>
      <span className="text-xs text-gray-400 font-medium">
        Aunthentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4 ">
        <InputField
          label="Subject Name"
          name="Subject Name"
          defaultValue={data?.subjectName}
          register={register}
          error={errors.subjectName}
        />
        <InputField
          label="Teachers"
          name="Teachers"
          defaultValue={data?.teachers}
          register={register}
          error={errors.teachers}
        />
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "create" : "update"}
      </button>
    </form>
  );
};

export default SubjectForm;