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
  student: z.string().min(1, { message: "student name is required!" }),
  score: z.string().min(1, { message: "score is required!" }),
  class: z.string().min(1, { message: "class is required!" }),
  teacher: z.string().min(1, { message: "Teacher's name is required!" }),
  date: z.string().min(8, { message: "date is required" }),
});

type Inputs = z.infer<typeof schema>;

const ResultForm = ({
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
          label="Student"
          name="student"
          defaultValue={data?.student}
          register={register}
          error={errors.student}
        />
        <InputField
          label="Score"
          name="score"
          defaultValue={data?.score}
          register={register}
          error={errors.class}
        />
        <InputField
          label="Class"
          name="class"
          defaultValue={data?.class}
          register={register}
          error={errors.class}
        />
        <InputField
          label="Teacher"
          name="Teacher"
          defaultValue={data?.teacher}
          register={register}
          error={errors.teacher}
        />
        <InputField
          label="Date"
          name="date"
          defaultValue={data?.dueDate}
          register={register}
          error={errors.date}
        />
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md">
        {type === "create" ? "create" : "update"}
      </button>
    </form>
  );
};

export default ResultForm;
