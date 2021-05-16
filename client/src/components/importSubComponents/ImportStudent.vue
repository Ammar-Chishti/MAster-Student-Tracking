<template>
  <v-row>
    <v-col cols="auto">
      <v-card class="elevation-1" width="380">
        <v-card-title> Import Student Data </v-card-title>
        <v-card-subtitle>
          Upload a .csv file containing student data<br />
          Upload a .csv file containing course plans <br />
          <b> This will delete all existing students</b>
        </v-card-subtitle>

        <v-divider></v-divider>

        <v-card-actions>
          <v-file-input
            v-model="file"
            hide-details
            truncate-length="40"
            dense
            outlined
            :clearable="true"
            :disabled="disabled"
            show-size
            accept=".csv"
            placeholder="Click here to upload student data"
          >
            <template v-slot:selection="{ text }">
              <v-chip small label color="primary">
                {{ text }}
              </v-chip>
            </template>
          </v-file-input>
        </v-card-actions>
        <v-card-actions>
          <v-file-input
            v-model="file2"
            hide-details
            truncate-length="40"
            dense
            outlined
            :clearable="true"
            :disabled="disabled"
            show-size
            accept=".csv"
            placeholder="Click here to upload course plan data"
          >
            <template v-slot:selection="{ text }">
              <v-chip small label color="primary">
                {{ text }}
              </v-chip>
            </template>
          </v-file-input>
        </v-card-actions>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            :disabled="file === null || file2 === null || disabled"
            @click="submit"
            >Submit</v-btn
          >
        </v-card-actions>
        <v-progress-linear
          bottom
          :active="loading"
          :indeterminate="loading"
        ></v-progress-linear>
      </v-card>
    </v-col>

    <v-col>
      <v-card>
        {{ this.response }}
      </v-card>
      <v-card>
        {{ this.response2 }}
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../../APIService";
export default {
  data() {
    return {
      file: null,
      file2: null,
      disabled: false,
      loading: false,
      response: "",
      response2: "",
    };
  },

  async created() {
    if (!this.$store.state.loggedInUser.isGPD) {
      this.$router.push("studenthomepage");
      return;
    }
  },

  methods: {
    async submit() {
      console.log(this.file);
      if (this.file === null) {
        return;
      }
      this.loading = true;
      this.disabled = true;

      // await APIService.delete("/api/student");
      const response = await APIService.upload(
        "/api/import/student",
        this.file
      );
      this.response =
        "Import Student: " +
        response.failed +
        " failed out of " +
        response.total;

      const response2 = await APIService.upload(
        "/api/import/courseplan",
        this.file2
      );
      this.response2 =
        "Import Course Plan: " +
        response2.failed +
        " failed out of " +
        response2.total;
      this.loading = false;

      this.$store.state.selectedID = "N/A";
      this.file = null;
      this.file2 = null;
      this.disabled = false;
    },
  },
};
</script>
