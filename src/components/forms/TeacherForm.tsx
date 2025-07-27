"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import Image from "next/image";
import { Dispatch, SetStateAction, useState } from "react";
import { teacherSchema, TeacherSchema } from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CldUploadWidget } from "next-cloudinary";
import { RelatedData } from "../FormContainer";
import { Subject } from "@prisma/client";

const TeacherForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: TeacherSchema;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: RelatedData;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherSchema>({
    resolver: zodResolver(teacherSchema),
  });

  const [img, setImg] = useState<{ secure_url: string } | undefined>();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { subjects } = relatedData || {};

  const onSubmit = async (formData: TeacherSchema) => {
    setLoading(true);
    try {
      const method = type === "create" ? "POST" : "PUT";
      const res = await fetch("/api/teachers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, img: img?.secure_url }),
      });
      const result = await res.json();
      if (result.success) {
        toast(`Teacher has been ${type === "create" ? "created" : "updated"}!`);
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
        {type === "create" ? "Create a new teacher" : "Update the teacher"}
      </h1>
      <span className="text-xs text-gray-400 font-medium">
        Authentication Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Username"
          defaultValue={data?.username}
          {...register("username")}
          error={errors?.username?.message}
        />
        <InputField
          label="Email"
          defaultValue={data?.email}
          {...register("email")}
          error={errors?.email?.message}
        />
        <InputField
          label="Password"
          type="password"
          defaultValue={data?.password}
          {...register("password")}
          error={errors?.password?.message}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium">
        Personal Information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First Name"
          defaultValue={data?.name}
          {...register("name")}
          error={errors.name?.message}
        />
        <InputField
          label="Last Name"
          defaultValue={data?.surname}
          {...register("surname")}
          error={errors.surname?.message}
        />
        <InputField
          label="Phone"
          defaultValue={data?.phone}
          {...register("phone")}
          error={errors.phone?.message}
        />
        <InputField
          label="Address"
          defaultValue={data?.address}
          {...register("address")}
          error={errors.address?.message}
        />
        <InputField
          label="Blood Type"
          defaultValue={data?.bloodType}
          {...register("bloodType")}
          error={errors.bloodType?.message}
        />
        <InputField
          label="Birthday"
          defaultValue={data?.birthday?.toString().split("T")[0]}
          {...register("birthday")}
          error={errors.birthday?.message}
          type="date"
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
          <label className="text-xs text-gray-500">Sex</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("sex")}
            defaultValue={data?.sex}
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {errors.sex?.message && (
            <p className="text-xs text-red-400">
              {errors.sex.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subjects</label>
          <select
            multiple
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            {...register("subjects")}
            defaultValue={data?.subjects}
          >
            {subjects?.map((subject: Subject) => (
              <option value={subject.id} key={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
          {errors.subjects?.message && (
            <p className="text-xs text-red-400">
              {errors.subjects.message}
            </p>
          )}
        </div>
        <CldUploadWidget
          uploadPreset="school"
          onSuccess={(result, { widget }) => {
            setImg((result?.info as { secure_url: string }) || undefined);
            widget.close();
          }}
        >
          {({ open }) => {
            return (
              <div
                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                onClick={() => open()}
              >
                <Image src="/upload.png" alt="" width={28} height={28} />
                <span>Upload a photo</span>
              </div>
            );
          }}
        </CldUploadWidget>
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

export default TeacherForm;