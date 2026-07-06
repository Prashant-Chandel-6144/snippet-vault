import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

const setApiKey = async(key:string)=>{
    try {
        await SecureStore.setItemAsync("API_KEY", key)
    } catch (error) {
        console.log(error)
        Alert.alert("Error", "Error while saving Api Key")
    }
}

const getApiKey = async(showAlert: boolean = false)=>{
    try {
        const key = await SecureStore.getItemAsync("API_KEY")
        if(!key && showAlert){
            Alert.alert("API Key Required", "Please enter your Api Key")
        }
        return key
    } catch (error) {
        console.log(error)
    }
}

const deleteApiKey = async()=>{
    try {
        await SecureStore.deleteItemAsync("API_KEY")
        Alert.alert("Key Deleted", "Api key is deleted")
    } catch (error) {
        console.log(error)
        
    }
}

export {
    setApiKey,
    getApiKey,  
    deleteApiKey
}