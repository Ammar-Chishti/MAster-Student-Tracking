<template>
  <v-row>
    <v-col cols="auto">
      <v-card class="elevation-1" width="380">
        <v-card-title> Import Degree Requirements </v-card-title>
        <v-card-subtitle>
          Upload a .json file containing degree requirements
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
            show-size
            accept=".json"
            placeholder="Click here to browse files"
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
            :disabled="file === null || disableButton"
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
    </v-col>
  </v-row>
</template>

<script>
import APIService from "../../APIService";
export default {
  data() {
    return {
      file: null,
      disableButton: false,
      loading: false,
      response: "",
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
      this.disableButton = true;
      const response = await APIService.upload(
        "/api/import/degreerequirement",
        this.file
      );

      this.response =
        "Import Degree Requirements: " +
        response.failed +
        " failed out of " +
        response.total;
      this.loading = false;

      this.file = null;
      this.disableButton = false;
      this.loading = false;
    },
  },
};
</script>
