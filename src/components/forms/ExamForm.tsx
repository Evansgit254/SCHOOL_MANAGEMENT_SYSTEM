"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import {
  examSchema,
  ExamSchema,
} from "@/lib/formValidationSchemas";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { RelatedData } from "../FormContainer";
import { Lesson } from "@prisma/client";

const ExamForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: ExamSchema;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExamSchema>({
    resolver: zodResolver(examSchema),
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { lessons } = relatedData || {};

  const onSubmit = async (formData: ExamSchema) => {
    setLoading(true);
    try {
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch("/api/exams", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (result.success) {
        toast(`Exam has been ${type === "create" ? "created" : "updated"}!`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Something went wrong!");
      }
    } catch (error) {
      toast.error(`Something went wrong: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new exam" : "Update the exam"}
      </h1>

      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Exam title"
          defaultValue={data?.title}
          {...register("title")}
          error={errors?.title?.message}
        />
        <InputField
          label="Start Date"
          defaultValue={data?.startTime ? new Date(data.startTime).toISOString().slice(0, 16) : undefined}
          {...register("startTime")}
          error={errors?.startTime?.message}
          type="datetime-local"
        />
        <InputField
          label="End Date"
          defaultValue={data?.endTime ? new Date(data.endTime).toISOString().slice(0, 16) : undefined}
          {...register("endTime")}
          error={errors?.endTime?.message}
          type="datetime-local"
        />
        {data && (
          <InputField
            defaultValue={data?.id}
            {...register("id")}
            error={errors?.id?.message}
            hidden
          />
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Lesson</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("lessonId", { valueAsNumber: true })}
            defaultValue={data?.lessonId}
          >
            {lessons?.map((lesson: Lesson) => (
              <option value={lesson.id} key={lesson.id}>
                {lesson.name}
              </option>
            ))}
          </select>
          {errors.lessonId?.message && (
            <p className="text-xs text-red-400">
              {errors.lessonId.message}
            </p>
          )}
        </div>
      </div>
      <button className="bg-blue-400 text-white p-2 rounded-md" disabled={loading}>
        {loading
          ? type === "create"
            ? "Creating..."
            : "Updating..."
          : type === "create"
          ? "Create"
          : "Update"}
      </button>
    </form>
  );
};

export default ExamForm;