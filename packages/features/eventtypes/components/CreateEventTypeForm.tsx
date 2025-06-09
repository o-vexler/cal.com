import type { ReactNode } from "react";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useIsPlatform } from "@calcom/atoms/hooks/useIsPlatform";
import type { CreateEventTypeFormValues } from "@calcom/lib/hooks/useCreateEventType";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { md } from "@calcom/lib/markdownIt";
import slugify from "@calcom/lib/slugify";
import turndown from "@calcom/lib/turndownService";
import { trpc } from "@calcom/trpc/react";
import { Button } from "@calcom/ui/components/button";
import { Editor } from "@calcom/ui/components/editor";
import { Form } from "@calcom/ui/components/form";
import { TextAreaField } from "@calcom/ui/components/form";
import { TextField } from "@calcom/ui/components/form";
import { Tooltip } from "@calcom/ui/components/tooltip";
import { Sparkles } from "lucide-react";
import { showToast } from "@calcom/ui/components/toast";

export default function CreateEventTypeForm({
  form,
  isManagedEventType,
  handleSubmit,
  pageSlug,
  isPending,
  urlPrefix,
  SubmitButton,
}: {
  form: UseFormReturn<CreateEventTypeFormValues>;
  isManagedEventType: boolean;
  handleSubmit: (values: CreateEventTypeFormValues) => void;
  pageSlug?: string;
  isPending: boolean;
  urlPrefix?: string;
  SubmitButton: (isPending: boolean) => ReactNode;
}) {
  const isPlatform = useIsPlatform();
  const { t } = useLocale();
  const [firstRender, setFirstRender] = useState(true);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  const { register } = form;
  const generateEventTypeSuggestion = trpc.viewer.ai.generateEventTypeSuggestion.useMutation({
    onSuccess: (data) => {
      form.setValue("title", data.title);
      form.setValue("slug", data.slug);
      showToast("AI suggestion generated successfully", "success");
    },
    onError: (error) => {
      showToast(error.message || "Failed to generate AI suggestion", "error");
    },
    onSettled: () => {
      setIsGeneratingTitle(false);
    },
  });

  const handleGenerateAISuggestion = () => {
    const description = form.getValues("description");
    if (!description || description.trim().length === 0) {
      showToast("Please enter a description first", "warning");
      return;
    }
    setIsGeneratingTitle(true);
    generateEventTypeSuggestion.mutate({ description });
  };
  return (
    <Form
      form={form}
      handleSubmit={(values) => {
        handleSubmit(values);
      }}>
      <div className="mt-3 space-y-6 pb-11">
        <TextField
          label={t("title")}
          placeholder={t("quick_chat")}
          data-testid="event-type-quick-chat"
          {...register("title")}
          onChange={(e) => {
            form.setValue("title", e?.target.value);
            if (form.formState.touchedFields["slug"] === undefined) {
              form.setValue("slug", slugify(e?.target.value));
            }
          }}
        />

        {urlPrefix && urlPrefix.length >= 21 ? (
          <div>
            <TextField
              label={isPlatform ? "Slug" : `${t("url")}: ${urlPrefix}`}
              required
              addOnLeading={
                !isPlatform ? (
                  <Tooltip content={!isManagedEventType ? pageSlug : t("username_placeholder")}>
                    <span className="max-w-24 md:max-w-56">
                      /{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                    </span>
                  </Tooltip>
                ) : undefined
              }
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />

            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        ) : (
          <div>
            <TextField
              label={isPlatform ? "Slug" : t("url")}
              required
              addOnLeading={
                !isPlatform ? (
                  <Tooltip
                    content={`${urlPrefix}/${!isManagedEventType ? pageSlug : t("username_placeholder")}/`}>
                    <span className="max-w-24 md:max-w-56">
                      {urlPrefix}/{!isManagedEventType ? pageSlug : t("username_placeholder")}/
                    </span>
                  </Tooltip>
                ) : undefined
              }
              {...register("slug")}
              onChange={(e) => {
                form.setValue("slug", slugify(e?.target.value), { shouldTouch: true });
              }}
            />
            {isManagedEventType && !isPlatform && (
              <p className="mt-2 text-sm text-gray-600">{t("managed_event_url_clarification")}</p>
            )}
          </div>
        )}
        <>
          <div className="space-y-2">
            {isPlatform ? (
              <TextAreaField {...register("description")} placeholder={t("quick_video_meeting")} />
            ) : (
              <Editor
                getText={() => md.render(form.getValues("description") || "")}
                setText={(value: string) => form.setValue("description", turndown(value))}
                excludedToolbarItems={["blockType", "link"]}
                placeholder={t("quick_video_meeting")}
                firstRender={firstRender}
                setFirstRender={setFirstRender}
                maxHeight="200px"
              />
            )}
            <Button
              type="button"
              onClick={handleGenerateAISuggestion}
              disabled={isGeneratingTitle}
              loading={isGeneratingTitle}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              {isGeneratingTitle ? "Generating..." : "Generate Title & URL with AI"}
            </Button>
          </div>

          <div className="relative">
            <TextField
              type="number"
              required
              min="10"
              placeholder="15"
              label={t("duration")}
              className="pr-4"
              {...register("length", { valueAsNumber: true })}
              addOnSuffix={t("minutes")}
            />
          </div>
        </>
      </div>
      {SubmitButton(isPending)}
    </Form>
  );
}
